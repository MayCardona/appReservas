using System.ComponentModel.DataAnnotations;

namespace Reservas_Salas.Server.DTOs
{
    public class UpdateReservaDTO
    {
        [Required]
        public long IdReserva { get; set; }
        [Required]
        public int Estado {  get; set; }

    }
}
