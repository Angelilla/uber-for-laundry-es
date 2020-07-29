const express = require('express');
const authRouter = express.Router();

const bcrypt = require('bcryptjs');
const saltRounds = 10;
const User = require('./../models/user');

// GET /signup ===> renderizar el formulario de signup
authRouter.get('/signup', (req, res, next) => {
  // console.log('Entra en signup');
  res.render('auth/signup', { errorMessage: '' });
})

// POST /signup ===> recoger los datos del formulario y crear un nuevo usuario en la BDD
// con PROMISES
// authRouter.post('/signup', (req, res, next) => {
//   console.log('req.body', req.body);
//   const { name, email, password } = req.body;
//   // Comprobar que los campos email y password no esten en blanco
//   if(email === "" || password === "") {
//     res.render('auth/signup', { errorMessage: "Enter both email and password "});
//     return;
//   }
//   // Comprobar que no existe ningun usuario con este email en la BDD
//   User.findOne({ email })
//   .then( (foundUser) => {
//     if(foundUser) {
//       res.render('auth/signup', { errorMessage: `There's already an account with the email ${email}`});
//       return;
//     }
//     // no existe el usuario, encriptar la contraseña
//     const salt = bcrypt.genSaltSync(saltRounds);
//     const hashedPassword = bcrypt.hashSync(password, salt);
//     // guardar el usuario en la BDD
//     // const newUser = { name, email, password: hashedPassword };
//     User.create({ name, email, password: hashedPassword })
//     .then( () => {
//       res.redirect('/login');
//     })
//     .catch( (err) => {
//       res.render('auth/signup', { errorMessage: "Error while creating account. Please try again."})
//     });
//   })
//   .catch( (err) => console.log(err));
// })

// POST /signup ===> recoger los datos del formulario y crear un nuevo usuario en la BDD
// con ASYNC AWAIT
authRouter.post('/signup', async (req, res, next) => {
  console.log('req.body', req.body);
  const { name, email, password } = req.body;
  // Comprobar que los campos email y password no esten en blanco
  if(email === "" || password === "") {
    res.render('auth/signup', { errorMessage: "Enter both email and password "});
    return;
  }
  try {
      // Comprobar que no existe ningun usuario con este email en la BDD
    const foundUser = await User.findOne({ email })
    if(foundUser) {
      res.render('auth/signup', { errorMessage: `There's already an account with the email ${email}`});
      return;
    }
    // no existe el usuario, encriptar la contraseña
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);
    // guardar el usuario en la BDD
    await User.create({ name, email, password: hashedPassword })
    res.redirect('/login');
  } 
  catch (error) {
    res.render('auth/signup', { errorMessage: "Error while creating account. Please try again."})
  }
})

authRouter.get('/login', (req, res, next) => {
    res.render('auth/login', { errorMessage: '' })
});

authRouter.post('/login', (req, res, next) => {
    const { email, password } = req.body;
    
    if(email === "" || password === "") {
        res.render('auth/login', { errorMessage: 'Please, enter username and password to login.'});
        return;
    }
    
    User.findOne({ email }) 
        .then((user) => { //este user
            if(!user) {
                res.render('auth/login', { errorMessage: "The user doesn't exist"});
                return;
            }
            const correctePass = (bcrypt.compareSync(password, user.password))//es este user
            if(!correctePass) { 
              res.render('auth/login', { errorMessage: 'Incorrect password.' })
            } else {
              req.session.currentUser = user;
                res.redirect('/');
            }
        })
        .catch((error) => {
            console.log(error);
        })  
});

authRouter.get('/logout', (req, res, next) => {
    req.session.destroy(err => {
      res.redirect("/");
    });
});

module.exports = authRouter;