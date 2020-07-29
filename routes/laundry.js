const express = require('express');
const laundryRouter = express.Router();

const User = require('./../models/user');
const LaundryPickup = require('../models/laundry-pickup');

// MIDDLEWARE =>
laundryRouter.use((req, res, next) => {
    //si hay un usuario en la sesión (logueado), continúa con las rutas llamando a next() y retornando.
    if (req.session.currentUser) {
      next();
      return;
    }
    //si no hay ningún usuario en la sesión (anónimo), redirige a la página log in
    res.redirect('/login');
});// <= MIDDLEWARE

//refactorizar y entender bien esta ruta
laundryRouter.get('/dashboard', (req, res, next) => {
    let query;
  
    if (req.session.currentUser.isLaunderer) {
      query = { launderer: req.session.currentUser._id };
    } else {
      query = { user: req.session.currentUser._id };
    }
  
    LaundryPickup
      .find(query)
      .populate('user', 'name')
      .populate('launderer', 'name')
      .sort('pickupDate')
      .exec((err, pickupDocs) => {
        if (err) {
          next(err);
          return;
        }
  
        res.render('laundry/dashboard', {
          pickups: pickupDocs
        });
      });
  });

laundryRouter.post('/launderers', (req, res, next) => {
    //obtiene el _id del usuario de la sesión
    const userId = req.session.currentUser._id; 
    //prepara la información actualizada con la precio del formulario y isLaunderer está hardcoded como verdadero.
    const laundererInfo = {
        fee: req.body.fee,
        isLaunderer: true
      };
    
    //llama al método findByIdAndUpdate() de Mongoose para realizar las actualizaciones
    User.findByIdAndUpdate(userId, laundererInfo, { new: true }, (err, theUser) => {
        if(err) {
            next(err);
            return;
        }
        //actualiza la información del usuario en la sesión. 
        //Esto funciona en conjunto con la opción { new: true } de la línea 19 para obtener la información actualizada del usuario en el callback.
        req.session.currentUser = theUser;

        //redirecciona de nuevo al dashboard.
        res.redirect('/dashboard');
    })
})

laundryRouter.get('/launderers', (req, res, next) => {
    
    //consulta usuarios cuya propiedad isLaunderer es verdadera.
    User.find({
        $and: [
          { isLaunderer: true },
          //agregando esta línea, si somos lavanderos no nos veremos a nosotros mismos como lavanders disponibles
          { _id: { $ne: req.session.currentUser._id } } 
        ]
      })
    //.find({ isLaunderer: true }) ==> asi sale toda la lista, incluidos nosotros
        .then(launderersList => { 
            //renderiza la plantilla views/laundry/launderers.hbs
            //pasa los resultados de la consulta (launderersList) como la variable local launderers.
            res.render('laundry/launderers', {launderers: launderersList})
        })
        .catch(error => {
            console.log(error);
        })
});

laundryRouter.get('/launderers/:id', (req, res, next) => {
    User.findById(req.params.id)
        .then(launderer => {
            res.render('laundry/launderer-profile', {theLaunderer: launderer})
        })
        .catch(error => {
            console.log(error);
        })
});

laundryRouter.post('/laundry-pickups', (req, res, next) => {
    const pickupInfo = {
        pickupDate: req.body.pickupDate,
        launderer: req.body.laundererId,
        user: req.session.currentUser._id
      };
    LaundryPickup.create(pickupInfo)
        .then(() => {
            res.redirect('/dashboard');
        })
        .catch(error => {
            console.log(error);
        })
})

module.exports = laundryRouter;