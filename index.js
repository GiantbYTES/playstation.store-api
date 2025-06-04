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
  password: "1",
  port: 5432,
});

db.connect();

async function get_games_url(){
    const url = "https://store.playstation.com/en-us/pages/browse/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const urls = [];
    
    $('[class*="psw-l-w-1/6@laptop"]').each((i, el) =>{
        const game_url = $(el).find('a.psw-link.psw-content-link').attr('href');
        urls.push({game_url});
    });
    return urls;
}
async function get_data_from_gamepage(url)
{
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const item = {};
  item.title = $('[data-qa="mfe-game-title#name"]').text().trim();
  // item.name = $('[class*="psw-m-b-5 psw-t-title-l psw-t-size-7 psw-l-line-break-word"]').text().trim();
  item.num_of_ratings = $('[data-qa="mfe-star-rating#overall-rating#total-ratings"]').text().trim().replace("ratings","").trim();
  item.rating_val = $('[data-qa="mfe-game-title#average-rating"]').text().trim();
  item.sale_price = $('[data-qa="mfeCtaMain#offer0#finalPrice"]').text().trim();
  item.original_price = $('[data-qa="mfeCtaMain#offer0#originalPrice"]').text().trim();
  item.genres = $('[data-qa="gameInfo#releaseInformation#genre-value"]').text().trim();
  item.platforms = $('[data-qa="gameInfo#releaseInformation#platform-value"]').text().trim();
  
  if (item.original_price=='') 
  {
    item.original_price = item.sale_price;
    item.sale_price = '';
  }
  // item.push(name,num_of_ratings,rating_val,title,sale_price,original_price,genres);
  console.log(item);
  return item;
  // const genres = ;
  
  console.log(genres);
  
}
app.get("/", async (req, res) => 
{
    const urr = await get_games_url();
    urr.forEach(async (result) => await get_data_from_gamepage("https://store.playstation.com"+result.game_url));
    // await get_data_from_gamepage("https://store.playstation.com"+urr[0].game_url);
    // console.log(urr);
    const result = await db.query("SELECT * FROM games");
    let games = [];
    result.rows.forEach((game) => 
        {
            games.push(game);
        })
    // console.log(result.rows);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
