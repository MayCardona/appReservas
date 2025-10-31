using Reservas_Salas.Server.Models;

namespace Reservas_Salas.Server.Services.Interfaces
{
    public interface ISendMailService
    {
        Task<bool>SendMailAsync(MailSenderModel correo);
    }
}
