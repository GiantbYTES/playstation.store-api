import express from "express";
import { createClient } from '@supabase/supabase-js';
import pg from "pg";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function get_games_url(){
    let index = 1;
    const urls = [];
    
    for(;index <= 417;index++)
      {
        let url = "https://store.playstation.com/en-us/pages/browse/" + index;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        $('[class*="psw-l-w-1/6@laptop"]').each((i, el) =>{
            const game_url = $(el).find('a.psw-link.psw-content-link').attr('href');
            const thumbnail = $(el).find('[class="psw-layer"]').text().match(/src="([^"]+)"/)[1];
            urls.push({game_url,thumbnail});
        });
        await delay(300);
        console.log(index);
      }
    return urls;
}
async function get_data_from_gamepage(url,thumbnail)
{
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const item = {};
  item.title = $('[data-qa="mfe-game-title#name"]').text().trim();
  // item.name = $('[class*="psw-m-b-5 psw-t-title-l psw-t-size-7 psw-l-line-break-word"]').text().trim();
  item.num_of_ratings = $('[data-qa="mfe-star-rating#overall-rating#total-ratings"]').text().trim().replace("ratings","").trim();
  item.rating_val = $('[data-qa="mfe-game-title#average-rating"]').text().trim();
  item.sale_price = $('[data-qa="mfeCtaMain#offer0#finalPrice"]').text().trim().replace("$","");
  item.original_price = $('[data-qa="mfeCtaMain#offer0#originalPrice"]').text().trim().replace("$","");
  item.genres = "{"+$('[data-qa="gameInfo#releaseInformation#genre-value"]').text().trim()+"}";
  item.platforms ="{"+ $('[data-qa="gameInfo#releaseInformation#platform-value"]').text().trim()+"}";
  item.thumbnail = thumbnail;
  if (item.original_price=='') 
  {
    item.original_price = item.sale_price;
    item.sale_price = null;
  }
  if (item.original_price == 'Free')
  {
    item.original_price = 0;
  }
  if(item.rating_val == '')
    {
      item.rating_val = null;
    }
  if(item.num_of_ratings == '')
    {
      item.num_of_ratings = null;
    }
  // item.push(name,num_of_ratings,rating_val,title,sale_price,original_price,genres);
//   console.log(item);
  
  return item;
  // const genres = ;
  
  console.log(genres);
  
}
app.get("/", async (req, res) => 
{
    
    // console.log(urr);
    // urr.forEach(async (result) => 
    //   {
    //     await delay(10000); 
    //     let row = await get_data_from_gamepage("https://store.playstation.com"+result.game_url,result.thumbnail); 
    //     console.log(row);
    //     update_database(row);
        
    //   } )
    
    
    const { data, error } = await supabase.from('games').select('*');
    if (error) throw error;
    console.log(data);
    let games = [];
    data.rows.forEach((game) => 
        {
            games.push(game);
        })
      console.log(games);
    // console.log(result.rows);
});

async function main(){
  const urr = await get_games_url();
  for(let i = 0; i < urr.length; i++){
        let result = urr[i];
        await delay(350); 
        let row = await get_data_from_gamepage("https://store.playstation.com"+result.game_url,result.thumbnail); 
        console.log(row);
        update_database(row);
    }
}

async function update_database(row) {
  try {
    const { data, error } = await supabase
      .from('games')
      .upsert({
        title: row.title,
        genres: row.genres,
        original_price: row.original_price === '' ? null : row.original_price,
        sale_price: row.sale_price,
        final_price: row.sale_price ?  row.sale_price : row.original_price,
        rating: row.rating_val,
        num_ratings: row.num_of_ratings,
        platforms: row.platforms,
        thumbnail: row.thumbnail
      }, { onConflict: ['title'] });

    if (error) throw error;
    console.log('Upserted row:', data);
  } catch (err) {
    console.error('Error inserting row:', err.message);
  }
}

main();
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
