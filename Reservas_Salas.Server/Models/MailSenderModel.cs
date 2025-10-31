using System.ComponentModel.DataAnnotations;

namespace Reservas_Salas.Server.Models
{
    public class MailSenderModel
    {
        [Required]
        public string email { get; set; }
        [Required]
        public string subject { get; set; }
        [Required]
        public string body { get; set; }
    }
}
