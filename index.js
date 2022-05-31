const express = require('express');
const session = require('express-session');
const path = require('path');
const PORT = 8000;
const pageRouter = require('./pages/router');
const app = express();



//Setting Template Engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs');


//Middlewares
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname + '/public')));


//Sessions

app.use(session({
    secret:'hostelreservation',
    resave:'false',
    saveUninitialized:'false'
}));



//Routes

app.use('/',pageRouter);




//Application View Port
app.listen(PORT,()=>{
    console.log('Running on port 8000')
})



