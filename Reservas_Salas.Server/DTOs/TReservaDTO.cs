using System;

using System.ComponentModel.DataAnnotations;

namespace Reservas_Salas.Server.DTOs

{

    public class TReservaDTO

    {
        [Required]

        public long IdSala { get; set; }

        [Required]

        public long IdEmpleado { get; set; }

        [Required]

        public DateTime FechaInicio { get; set; }

        public DateTime? FechaFin { get; set; }
        public int Estado {  get; set; }

    }

}

