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

        private readonly ISendMailService _mailService;

        public OtpService(AppDbContext context, IHttpContextAccessor httpContextAccessor, ISendMailService mailService) 
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _mailService = mailService;
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
                MailSenderModel correo = new MailSenderModel();

                correo.email = empleado.Email;
                correo.subject = "Código de confirmación - Reservas Salas PROSEAR/INCREAR";
                correo.body = $@"
                            <body>
                            <h1>
                                Para ingresar al aplicativo de reservas digite el siguiente código de seguridad:
                            <br><br><b>{code}</b>
                            </h1>
                            </body>";

                await _mailService.SendMailAsync(correo);

                string CodeOtp = "";
                _httpContextAccessor.HttpContext.Session.SetString("CodeOtp", code);

                _httpContextAccessor.HttpContext.Session.SetString("IdEmpleado", Identificacion);
                CodeOtp = _httpContextAccessor.HttpContext.Session.GetString("CodeOtp");
                

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

                if (string.IsNullOrEmpty(CodeInput) || string.IsNullOrEmpty(CodeOtp))
                    return false;

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
                return false;
            }
        }

        public async Task<object> BringEmployeeInfoAsync(long IdEmpleado)
        {
            try
            {
                var empleado = await _context.TEmpleados
                    .Include(e => e.CargoNavigation)
                    .FirstOrDefaultAsync(e => e.IdEmpleado == IdEmpleado);

                if (empleado == null)
                    throw new Exception("Empleado no encontrado.");

                return new
                {
                    NombreCompleto = $"{empleado.Nombre} {empleado.Apellido}",
                    Cargo = empleado.CargoNavigation?.IdCargo ?? 0
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al traer información del empleado: {ex.Message}");
            }
        }
    }
}
