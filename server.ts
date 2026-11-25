import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { filterVenues, validateVenueInput } from './src/shared/catalogLogic.ts';
import type { ItemType, VenueCategory } from './src/shared/types.ts';
import {
  createVenue,
  deleteVenue,
  getStorageMode,
  getVenueById,
  listVenues,
  updateVenue,
} from './src/server/repository.ts';
import { askCatalogAssistant, type IncomingHistoryItem } from './src/server/gemini.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      storage: getStorageMode(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  app.get('/api/public-config', (_req, res) => {
    res.json({
      googleMapsApiKey:
        process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
        process.env.GOOGLE_MAPS_API_KEY?.trim() ||
        '',
      storage: getStorageMode(),
    });
  });

  app.get('/api/venues', async (req, res) => {
    try {
      const categoryParam = typeof req.query.category === 'string' ? req.query.category : 'todas';
      const itemTypeParam = typeof req.query.itemType === 'string' ? req.query.itemType : 'todos';
      const queryParam = typeof req.query.q === 'string' ? req.query.q : '';

      const validCategory: VenueCategory | 'todas' =
        categoryParam === 'tienda' || categoryParam === 'estudio' || categoryParam === 'escuela'
          ? categoryParam
          : 'todas';

      const validItemType: ItemType | 'todos' =
        itemTypeParam === 'instrumento' || itemTypeParam === 'clase' || itemTypeParam === 'servicio'
          ? itemTypeParam
          : 'todos';

      const allVenues = await listVenues();
      const filtered = filterVenues(allVenues, {
        category: validCategory,
        itemType: validItemType,
        query: queryParam,
      });

      res.json({ venues: filtered, total: allVenues.length });
    } catch (error) {
      console.error('Error en GET /api/venues:', error);
      res.status(500).json({ error: 'No se pudo consultar el catálogo de locales.' });
    }
  });

  app.get('/api/venues/:id', async (req, res) => {
    try {
      const venue = await getVenueById(req.params.id);
      if (!venue) {
        return res.status(404).json({ error: 'Local no encontrado.' });
      }
      return res.json({ venue });
    } catch (error) {
      console.error('Error en GET /api/venues/:id:', error);
      return res.status(500).json({ error: 'No se pudo obtener el detalle del local.' });
    }
  });

  app.post('/api/venues', async (req, res) => {
    const validation = validateVenueInput(req.body);
    if (!validation.valid || !validation.sanitized) {
      return res.status(400).json({
        error: validation.errors[0] || 'Datos inválidos.',
        errors: validation.errors,
      });
    }

    try {
      const venue = await createVenue(validation.sanitized);
      return res.status(201).json({ venue });
    } catch (error) {
      console.error('Error en POST /api/venues:', error);
      return res.status(500).json({ error: 'No se pudo registrar el local.' });
    }
  });

  app.put('/api/venues/:id', async (req, res) => {
    const validation = validateVenueInput(req.body);
    if (!validation.valid || !validation.sanitized) {
      return res.status(400).json({
        error: validation.errors[0] || 'Datos inválidos.',
        errors: validation.errors,
      });
    }

    try {
      const updated = await updateVenue(req.params.id, validation.sanitized);
      if (!updated) {
        return res.status(404).json({ error: 'Local no encontrado para actualizar.' });
      }
      return res.json({ venue: updated });
    } catch (error) {
      console.error('Error en PUT /api/venues/:id:', error);
      return res.status(500).json({ error: 'No se pudo actualizar el local.' });
    }
  });

  app.delete('/api/venues/:id', async (req, res) => {
    try {
      const deleted = await deleteVenue(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Local no encontrado para eliminar.' });
      }
      return res.json({ ok: true });
    } catch (error) {
      console.error('Error en DELETE /api/venues/:id:', error);
      return res.status(500).json({ error: 'No se pudo eliminar el local.' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({ error: 'Escribe una pregunta para el asistente.' });
    }

    const history: IncomingHistoryItem[] = rawHistory
      .filter(
        (item: unknown): item is IncomingHistoryItem =>
          Boolean(item) &&
          typeof item === 'object' &&
          ((item as IncomingHistoryItem).role === 'user' ||
            (item as IncomingHistoryItem).role === 'assistant') &&
          typeof (item as IncomingHistoryItem).content === 'string'
      )
      .map((item: IncomingHistoryItem) => ({
        role: item.role,
        content: item.content.slice(0, 2000),
      }));

    try {
      const venues = await listVenues();
      const reply = await askCatalogAssistant(message, history, venues);
      return res.json({ reply, venueCount: venues.length });
    } catch (error) {
      console.error('Error en POST /api/chat:', error);
      const errMsg = error instanceof Error ? error.message : 'Error al consultar el asistente.';
      return res.status(502).json({ error: errMsg });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found. Run npm run build.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Acorde server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
