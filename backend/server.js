const app = require('./app')

const connectDatabase = require('./config/database')


const dotenv = require('dotenv');


// Handle Uncaught exceptions
process.on('uncaughtException', err => {
    console.log(`ERROR: ${err.stack}`);
    console.log('Shutting down due to Uncaught exceptions');
    process.exit(1)
}) 

//Setting up config file 
dotenv.config({ path: 'config/config.env' })

console.log("✅ Chargement du fichier .env réussi !");
console.log("🔍 MONGO_URI:", process.env.DB_LOCAL_URI);

// connecting to database
connectDatabase();

const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`);
})

// Handle unhandled Promise rejections
process.on('unhandledRejection', err =>{
    console.log(`ERROR: ${err.message}`);
    console.log('Shutting down the server due to unhandled Promise rejections');
    server.close(()=>{
        process.exit(1)
    })
})

// Setting upload config
require('dotenv').config({ path: './config/config.env' });
console.log('Configuration Cloudinary:', {
  cloud: process.env.CLOUDINARY_CLOUD_NAME ? 'OK' : 'MANQUANT',
  key: process.env.CLOUDINARY_API_KEY ? 'OK' : 'MANQUANT'
});



