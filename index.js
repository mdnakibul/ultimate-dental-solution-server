const express = require('express');
const port = 5000;
const MongoClient = require('mongodb').MongoClient;
var cors = require('cors')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express()
// Middle wares 
app.use(cors())
app.use(bodyParser.json());
app.use(express.static('doctors'));
app.use(fileUpload())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mymds.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db(`${process.env.DB_NAME}`).collection("appointment");
  const doctorCollection = client.db("doctorsPortal").collection("doctors");
  // perform actions on the collection object

  // Add an appointment 

  app.post('/addAppointment', (req, res) => {
    const appointment = req.body;
    console.log(appointment);
    appointmentCollection.insertOne(appointment)
      .then(result => {
        console.log(result.insertedCount);
        res.send(result.insertedCount > 0)
      })

  });

  // Get Appointment By Date 

  // app.post('/appointmentsByDate', (req, res) => {
  //   const date = req.body;
  //   console.log(typeof date.date);
  //   appointmentCollection.find({ date: date.date })
  //     .toArray((err, documents) => {
  //       res.send(documents)
  //     })
  // })
  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email })
        .toArray((err, doctors) => {
            const filter = { date: date.date }
            if (doctors.length === 0) {
                filter.email = email;
            }
            appointmentCollection.find(filter)
                .toArray((err, documents) => {
                    console.log(email, date.date, doctors, documents)
                    res.send(documents);
                })
        })
})
  //  Add Doctor 

  app.post('/addADoctor', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    console.log(name, email, file);
    const encImg = newImg.toString('base64');
    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };

    doctorCollection.insertOne({ name, email, image })
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  // Get All Doctors 

  app.get('/doctors', (req, res) => {
    doctorCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });

  // Identify Doctor 

  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email })
        .toArray((err, doctors) => {
            res.send(doctors.length > 0);
        })
})

  console.log('Database Connected');
});

// Home Page 
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT || port)