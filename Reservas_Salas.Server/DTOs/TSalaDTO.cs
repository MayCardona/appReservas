using System.ComponentModel.DataAnnotations;


namespace Reservas_Salas.Server.DTOs
{
    public class TSalaDTO
    {
        [Required]
        public long IdSala { get; set; }
        [Required]
        public int? Reservado{ get; set; }
    }
}
