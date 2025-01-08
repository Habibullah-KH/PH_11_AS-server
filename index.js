const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.send('surver is running')
})

app.listen(port, ()=>{
    console.log(`surver is running on ${port}`)
})