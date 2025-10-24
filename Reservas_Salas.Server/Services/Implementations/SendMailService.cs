using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;
using System.Globalization;
using System.Net;
using System.Net.Mail;

namespace Reservas_Salas.Server.Services.Implementations
{
    public class SendMailService : ISendMailService
    {

        private readonly AppDbContext _context;


        public SendMailService (AppDbContext context)
        {
            _context = context;
        }
        public async Task<bool> SendMailAsync(MailSenderModel sender)
        {
            try
            {
                using (var smtp = new SmtpClient("smtp.office365.com", 587))
                {
                    smtp.Credentials = new NetworkCredential("Info@increar.com.co", "P*556918403570af");
                    smtp.EnableSsl = true;
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;

                    var mail = new MailMessage
                    {
                        From = new MailAddress("Info@increar.com.co", "Reservas Salas"),
                        Subject = sender.subject,
                        IsBodyHtml = true,
                        Body = sender.body
                    };

                    mail.To.Add(new MailAddress(sender.email));
                    mail.Priority = MailPriority.High;

                    await smtp.SendMailAsync(mail);
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error enviando correo: {ex}");
                return false;
            }
        }
    }
}
