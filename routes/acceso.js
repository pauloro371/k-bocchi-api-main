const express = require("express");
const router = express.Router();
const { getAuth } = require("firebase-admin/auth");
const Usuario = require("../Models/Usuario");



const validaciones = [
]
const validacionesTerapeuta = []

router.post("/registrar", async (req, res, next) => {
  
});

router.post("/login", (req, res, next) => {});

module.exports = router;
