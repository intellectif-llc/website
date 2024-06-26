import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

//Resolve _dirname for ES Modules
const _filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(_filename);

const app =express();
const port = 3000;

//Set 'views' directory for any views
app.set('views', path.join(__dirname,'views'));
//Set view engine to 'ejs'
app.set('view engine', 'ejs');

//Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

//Define a route to render the index.ejs view
app.get('/', (req, res) => {
 res.render('index');
});

app.listen(port, () => {
    console.log('Server is running on http://localhost:${port}');
})