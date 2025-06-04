import express from "express";
// import pool from './db';
import pg from "pg";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const port = 3000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Games",
  password: "Pss10!@#",
  port: 5432,
});

db.connect();

app.get("/", async (req, res) => 
{
    const url = "https://store.playstation.com/en-us/pages/browse/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const items = [];

    
    $('web-store__primary-page').each((i, el) =>{
        console.log("Element: ");
        console.log(el);
        const name = $(el).find('ems-sdk-grid#productTile0#product-name').text().trim();

        items.push({name});
    });

    console.log(items);


    const result = await db.query("SELECT * FROM games");
    let games = [];
    result.rows.forEach((game) => 
        {
            games.push(game);
        })
    // console.log(result.rows);
});

async function scrapeItems(){
    const url = "https://store.playstation.com/en-us/pages/browse/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const items = [];

    $('.product-class').each((i, el) =>{
        const name = $(el).find('.product-name').text().trim();

        items.push({ name, price, url: itemUrl, image});
    });
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
