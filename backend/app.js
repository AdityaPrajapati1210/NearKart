const express = require("express");
const app = express();
const userRoute = require('./routes/userRoute');
require('./models/mongoose');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/api/users", userRoute);

app.get("/",(req,res)=>{
    res.send("working");
})


app.use((err, req, res, next) => {                                         //error handling middleware
    const { statusCode = 500, message = "Something went wrong!" } = err;

    res.status(statusCode).json({
        success: false,
        message: message
    });
});

app.listen(3000,()=>{
    console.log("backend start on port 3000.");
})