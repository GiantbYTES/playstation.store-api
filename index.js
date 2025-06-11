import express from "express";
// import pool from './db';
import pg from "pg";
import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/", async (req, res) => {
  try {
    const { data: games, error } = await supabase
      .from("games")
      .select("*");

    if (error) throw error;

    console.log(games); // for debugging
    res.json(games);    // send data to browser
  } catch (err) {
    console.error("Error fetching from Supabase:", err.message);
    res.status(500).json({ error: "Failed to fetch data from Supabase" });
  }
});
app.get("/filter", async (req, res) => {
  try {
    let query = supabase.from("games").select("*");

    const {
      rating,
      rating_from,
      rating_until,
      num_of_ratings_from,
      num_of_ratings_until,
      on_sale,
      original_price_min,
      original_price_max,
      final_price_min,
      final_price_max,
      platform_ps4,
      platform_ps5,
      genres,
	  sort,
	  order_by
    } = req.query;

    if (rating_from) {
      query = query.gte("rating", parseFloat(rating_from));
    }
    if (rating_until) {
      query = query.lte("rating", parseFloat(rating_until));
    }
    if (num_of_ratings_from) {
      query = query.gte("num_ratings", parseInt(num_of_ratings_from));
    }
    if (num_of_ratings_until) {
      query = query.lte("num_ratings", parseInt(num_of_ratings_until));
    }
    if (original_price_min) {
      query = query.gte("original_price", parseFloat(original_price_min));
    }
    if (original_price_max) {
      query = query.lte("original_price", parseFloat(original_price_max));
    }
    if (on_sale && on_sale != "false") {
      query = query.not("sale_price", "is", null); // sale_price IS NOT NULL
    }
    if (final_price_min)
    {
      query = query.gte("final_price", parseFloat(final_price_min));
    }
    if (final_price_max)
    {
      query = query.lte("final_price", parseFloat(final_price_max));
    }

    // Handle platform filtering
    const platforms = [];
    if (platform_ps4 === "true") platforms.push("PS4");
    if (platform_ps5 === "true") platforms.push("PS5");
    if (platforms.length > 0) {
      query = query.overlaps("platform", platforms); // platform && ARRAY[...]
    }

    // Handle genres filtering
    if (genres) {
      const genres_arr = Array.isArray(genres)
        ? genres
        : genres.split(",").map((g) => g.trim());
      query = query.overlaps("genres", genres_arr); // genres && ARRAY[...]
    }

    // Order by rating descending
	if (sort && order_by)
	{
		query = query.order(sort, { ascending: order_by === "asc" });
	}
	else if(sort)
	{
		query = query.order(sort, { ascending: false });
	}
	else
	{
		query = query.order("num_ratings", { ascending: false });
	}
    

    const { data, error } = await query;

    if (error) {
      console.error("Supabase filter query error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Unexpected filter error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
