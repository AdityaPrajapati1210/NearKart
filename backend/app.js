const app = require("express");
app = express();

app.get("/",(req,res)=>{
    res.send("working");
})


app.listen(3000,()=>{
    console.log("backend start on port 3000.");
})