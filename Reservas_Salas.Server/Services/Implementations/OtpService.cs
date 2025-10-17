using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;
using System.Net;
using System.Net.Mail;

namespace Reservas_Salas.Server.Services.Implementations
{
    public class OtpService : IOtpService
    {
        private readonly AppDbContext _context;

        private readonly IHttpContextAccessor _httpContextAccessor;

        public OtpService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<string> GenerateOtpAsync(long IdEmpleado)
        {
            var empleado = await _context.TEmpleados.FirstOrDefaultAsync(e => e.IdEmpleado == IdEmpleado);
            if (empleado == null)
            {
                throw new Exception("Empleado no encontrado.");
            }

            if (string.IsNullOrEmpty(empleado.Email))
            {
                throw new Exception("El empleado no tiene correo registrado.");
            }

            string Identificacion = IdEmpleado.ToString();

            // Generar código OTP
            var randomNumber = new Random().Next(100001, 999999);
            string code = randomNumber.ToString();

            // Enviar correo con Office 365
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
                        Subject = "Código de confirmación - Reservas Salas PROSEAR/INCREAR",
                        IsBodyHtml = true,
                        Body = $@"
                            <body>
                            <h1>
                                Para ingresar al aplicativo de reservas digite el siguiente código de seguridad:
                            <br><br><b>{code}</b>
                            </h1>
                            </body>"
                    };

                    mail.To.Add(new MailAddress(empleado.Email));
                    mail.Priority = MailPriority.High;

                    await smtp.SendMailAsync(mail);
                    string CodeOtp = "";
                    _httpContextAccessor.HttpContext.Session.SetString("CodeOtp", code);

                    _httpContextAccessor.HttpContext.Session.SetString("IdEmpleado", Identificacion);
                    CodeOtp = _httpContextAccessor.HttpContext.Session.GetString("CodeOtp");
                }

                return code;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al enviar el correo: {ex.Message}");
            }

        }

        public async Task<bool> ValidateOtpAsync(long IdEmpleado, string CodeInput)
        {
            try
            {
                string CodeOtp = "";
                if (!string.IsNullOrEmpty(_httpContextAccessor.HttpContext.Session.GetString("CodeOtp"))) 
                {
                    CodeOtp = _httpContextAccessor.HttpContext.Session.GetString("CodeOtp");
                }
                
                if (CodeOtp == null || CodeOtp == "") 
                {
                    throw new Exception("Codigo OTP no encontrado");
                }
                 //validar employee antes de otp

                if (Convert.ToInt32(CodeInput) == Convert.ToInt32(CodeOtp))
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            catch(Exception ex)
            {
                throw new Exception($"Error al Validar el codigo OTP: {ex.Message}");
            }
        }

        public async Task<string> BringEmployeeNameAsync(long IdEmpleado)
        {
            try
            {
                var empleado = await _context.TEmpleados.FirstOrDefaultAsync(e => e.IdEmpleado == IdEmpleado);

                if (empleado == null)
                {
                    throw new Exception("Empleado no encontrado.");
                }

                var empleadoName = $"{empleado.Nombre} {empleado.Apellido}";

                return empleadoName;
            }catch(Exception ex)
            {
                throw new Exception($"Error al traer el nombre del empleado: {ex.Message}");
            }
        }
    }
}
