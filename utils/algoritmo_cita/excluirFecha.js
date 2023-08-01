const Cita = require("../../Models/Cita");

exports.obtenerCitasFechasExcluyente = async (id_terapeuta, fecha) => {
    try {
      let citas = await Cita.query()
        .where("id_terapeuta", "=", id_terapeuta)
        .modify((builder) => {
          let fechaInicio = date.parse(fecha, patternFecha);
          if (fecha && !isNaN(fechaInicio)) {
            let fechaLimite = date.addDays(fechaInicio, 1);
            let fechaInicioFormateada = date.format(fechaInicio, patternFecha);
            let FechaFinalFormateada = date.format(fechaLimite, patternFecha);
            let fechaActual = date.addDays(obtenerFechaActualMexico(), 1);
            let fechaActualFormateada = date.format(
              fechaActual,
              patternFecha,
              true
            );
            // console.log(new Date(Date.now()).toLocaleString());
            builder
              .andWhere("fecha", ">=", fechaActualFormateada)
              .andWhere("fecha", "<", fechaInicioFormateada)
              .orWhere("fecha", ">=", FechaFinalFormateada);
          }
        })
        .orderBy("fecha", "DESC")
        .debug();
      return citas;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  };