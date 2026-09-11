const express = require("express");
const app = express();
const userRoute = require('./routes/userRoute');
const session = require('express-session');
require('./models/mongoose');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({                                          //sesssion middleware
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 24*60* 60*1000,
        maxAge:24*60* 60*1000,
    }
}));

app.use("/api/users", userRoute);           //user route.......transfer

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