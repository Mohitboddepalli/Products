const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3").verbose();
const axios =require("axios")
var cors = require('cors')
const app =express()
app.use(express.json())

app.use(cors())
const db =new sqlite3.Database("./product_transaction.db",sqlite3.open_READWRITE,(err)=>{
  if(err) console.error(err)
  
})







const doNetworkCall = async () => {
  
const url ="https://s3.amazonaws.com/roxiler.com/product_transaction.json"

  try{
  const {data} =await axios.get(url)
   let productDetails =data
   productDetails.forEach(each=>{
    const details ={
      id:each.id,
      title:each.title,
      price:each.price,
      description:each.description,
      category:each.category,
      image:each.image,
      sold:each.sold,
      date_of_sale:each.dateOfSale
    }

    sql =`insert or ignore into products 
    (id,title,price,description,category,image,sold,date_of_sale)
    values(?,?,?,?,?,?,?,?)`
       db.run(sql,[details.id,details.title,details.price,details.description,details.category,details.image,details.sold,details.date_of_sale],(err)=>{
      if(err) console.error(err);
      //  else console.log("succes")
      
   })





  })}
  catch(err){
    console.log(err.message)
  }
  


  
  }
 
  doNetworkCall();

  app.get("/allTransactions",async (request,response)=>{
    const {limit=10,offset=0,month ="3",search_q=""} =request.query

    const sql =`select * from products where cast(strftime("%m", date_of_sale)as int)='${month}'  and (title LIKE "%${search_q}%" OR description LIKE "%${search_q}%" OR price LIKE "%${search_q}%"  ) limit ${limit} offset ${offset}`
    const countQuery=`select count(*) as count from products where cast(strftime("%m",date_of_sale)as int) =${month}`

    try{
     db.all(sql,[],(err,rows)=>{
        db.get(countQuery, [], (err, result) => {
          const total_count = result;
        return response.status(200).json({rows,total_pages:total_count})
      })
     
    })
  }catch(err){
    throw err
  }}
  )
  app.get("/statastics",(request,response)=>{
    const {month=""} =request.query
    const query =`select  sum(price) as totalprice,sum(sold) as soldItems, (count(1)-sum(sold)) as unsold  from products where cast(strftime("%m", date_of_sale)as int)='${month}'`
    try{
      db.all(query,[],(err,rows)=>{
        if (err) return response.status(400)
        return response.json(rows)
      })


    }catch(error){
      console.log(error.message)

    }
  })

  app.get("/category",(request,response)=>{
    console.log("rows")

    const {month=""} =request.query
    const query =`SELECT
    SUM(CASE WHEN price BETWEEN 0 AND 100 THEN 1 ELSE 0 END) AS "0 - 100",
    SUM(CASE WHEN price BETWEEN 101 AND 200 THEN 1 ELSE 0 END) AS "101 - 200",
    SUM(CASE WHEN price BETWEEN 201 AND 300 THEN 1 ELSE 0 END) AS "201 - 300",
    SUM(CASE WHEN price BETWEEN 301 AND 400 THEN 1 ELSE 0 END) AS "301 - 400",
    SUM(CASE WHEN price BETWEEN 401 AND 500 THEN 1 ELSE 0 END) AS "401 - 500",
    SUM(CASE WHEN price BETWEEN 501 AND 600 THEN 1 ELSE 0 END) AS "501 - 600",
    SUM(CASE WHEN price BETWEEN 601 AND 700 THEN 1 ELSE 0 END) AS "601 - 700",
    SUM(CASE WHEN price BETWEEN 701 AND 800 THEN 1 ELSE 0 END) AS "701 - 800",
    SUM(CASE WHEN price BETWEEN 801 AND 900 THEN 1 ELSE 0 END) AS "801 - 900",
    SUM(CASE WHEN price > 900 THEN 1 ELSE 0 END) AS "901 and above"
FROM products  where cast(strftime("%m", date_of_sale)as int)='${month}'`
    db.all(query,[],(err,rows)=>{
      if (err){
        return response.status(400)
      }
      return response.json(rows)
    })

  })


  app.get("/itemsCount",(request,response)=>{
    const {month="",} =request.query
    const query =`select category,count()as items from products where cast(strftime("%m", date_of_sale)as int)='${month}' group by category `
    db.all(query,[],(err,rows)=>{
      if (err){
        return response.status(400)
      }
      return response.json(rows)
    })

  })

  app.get("/count",(request,response)=>{
    const {month ="",category=""} =request.query
    const query =`select category,count()as items from products where cast(strftime("%m", date_of_sale)as int)='${month}'and ' ' || category || ' ' LIKE '%${category}%' group by category `
    db.all(query,[],(err,rows)=>{
      if (err){
        return response.status(400)
      }
      return response.json(rows)
    })

  })



  app.listen(3009)
