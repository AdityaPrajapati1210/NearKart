const express = require("express");
const app = express();
const userRoute = require('./routes/userRoute');
require('./models/mongoose');

app.use(express.json());


app.use("/api/users", userRoute);

app.get("/",(req,res)=>{
    res.send("working");
})


app.listen(3000,()=>{
    console.log("backend start on port 3000.");
})