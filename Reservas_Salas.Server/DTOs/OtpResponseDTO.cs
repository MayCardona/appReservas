using System.ComponentModel.DataAnnotations;

namespace Reservas_Salas.Server.DTOs
{
    public class OtpResponseDTO
    {
        public long IdEmpleado { get; set; }
        public string OtpCode { get; set; }
    }
}
