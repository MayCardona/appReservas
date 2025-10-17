using System.ComponentModel.DataAnnotations;

namespace Reservas_Salas.Server.Models
{
    public class OtpModel
    {
        public int IdOtp { get; set; }

        [Required]
        public string Email { get; set; }

        [Required]
        public string Code { get; set; }

        public DateTime Expiration { get; set; }
        public bool IsUsed { get; set; }
    }
}
