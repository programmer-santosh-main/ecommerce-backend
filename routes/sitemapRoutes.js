// routes/sitemapRoutes.js
import express from "express";
import { serveSitemap } from "../controllers/sitemapController.js";

const router = express.Router();

// serve at /sitemap.xml
router.get("/sitemap.xml", serveSitemap);

// optionally also expose /sitemap (redirect)
router.get("/sitemap", (req, res) => res.redirect(301, "/sitemap.xml"));

export default router;
