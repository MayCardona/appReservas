using Microsoft.EntityFrameworkCore;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.DTOs;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;
using System.Net;
using System.Net.Mail;

namespace Reservas_Salas.Server.Services.Implementations
{
    public class TReservaService : ITReservaService
    {
        private readonly AppDbContext _context;

        public TReservaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TReserva>> GetAllAsync()
        {
            return await _context.TReservas.ToListAsync();
        }

        public async Task<TReserva?> GetByIdAsync(long id)
        {
            var coso = await _context.TReservas.FindAsync(id);
            return coso;
        }
        public async Task<List<ReservaEmpleadoDTO>> GetByEmployeeIdAsync(long id)
        {
            return await _context.TReservas
                .Where(r => r.IdEmpleado == id)
                .Join(
                    _context.TSalas,
                    reserva => reserva.IdSala,
                    sala => sala.IdSala,
                    (reserva, sala) => new ReservaEmpleadoDTO
                    {
                        IdReserva = reserva.IdReserva,
                        FechaInicio = reserva.FechaInicio,
                        FechaFin = reserva.FechaFin,
                        IdSala = sala.IdSala,
                        NombreSala = sala.Salas,
                        Estado = reserva.Estado
                    }
                )
                .OrderByDescending(r => r.FechaInicio)
                .ToListAsync();
        }


        public async Task<IEnumerable<TReserva>> GetReservasPorSalaYFechaAsync(long idSala, DateTime fecha)
        {
            return await _context.TReservas
                .Include(r => r.IdEmpleadoNavigation)
                    .ThenInclude(e => e.CargoNavigation)
                 .Include(r => r.IdSalaNavigation)
                 .Where(r => r.IdSala == idSala && r.FechaInicio.Date == fecha.Date)
                 .OrderBy(r => r.FechaInicio)
                 .ToListAsync();
        }

        public async Task<TReserva> CreateAsync(TReserva reserva)
        {
            if (reserva == null)
                throw new ArgumentNullException(nameof(reserva));

            // 🔹 Validar sala
            var sala = await _context.TSalas.FindAsync(reserva.IdSala);
            if (sala == null)
                throw new InvalidOperationException("La sala especificada no existe.");

            
           
            var fechaReserva = reserva.FechaInicio.Date;

            // 🔹 Verificar conflictos
            bool hayConflicto = await _context.TReservas.AnyAsync(r =>
                r.IdSala == reserva.IdSala &&
                r.Estado != 0 && // solo reservas activas
                (
                    (reserva.FechaInicio >= r.FechaInicio && reserva.FechaInicio < r.FechaFin) ||
                    (reserva.FechaFin > r.FechaInicio && reserva.FechaFin <= r.FechaFin) ||
                    (reserva.FechaInicio <= r.FechaInicio && reserva.FechaFin >= r.FechaFin)
                )
            );

            if (hayConflicto)
                throw new InvalidOperationException("La sala no está disponible en el horario seleccionado.");

            // 🔹 Obtener el empleado asociado
            var empleado = await _context.TEmpleados
                .Include(e => e.CargoNavigation)
                .FirstOrDefaultAsync(e => e.IdEmpleado == reserva.IdEmpleado);

            if (empleado == null)
                throw new InvalidOperationException("El empleado no existe.");

            if (string.IsNullOrEmpty(empleado.Email))
                throw new InvalidOperationException("El empleado no tiene un correo registrado.");

            // 🔹 Guardar la reserva
            _context.TReservas.Add(reserva);
            await _context.SaveChangesAsync();

            //  Enviar correo de confirmación
            try
            {
                using (var smtp = new SmtpClient("smtp.office365.com", 587))
                {
                    smtp.Credentials = new NetworkCredential("Info@increar.com.co", "P*556918403570af");
                    smtp.EnableSsl = true;
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;

                    string fecha = reserva.FechaInicio.ToString("dddd, dd MMMM yyyy", new System.Globalization.CultureInfo("es-ES"));
                    string horaInicio = reserva.FechaInicio.ToString("HH:mm");
                    string horaFin = reserva.FechaFin.ToString("HH:mm");

                    var mail = new MailMessage
                    {
                        From = new MailAddress("Info@increar.com.co", "Reservas Salas"),
                        Subject = "Confirmación de reserva de sala - PROSEAR / INCREAR",
                        IsBodyHtml = true,
                        Body = $@"
                    <body style='font-family: Arial; color:#333;'>
                        <h2>Confirmación de reserva</h2>
                        <p>Hola <b>{empleado.Nombre} {empleado.Apellido}</b>,</p>
                        <p>Tu reserva se ha registrado exitosamente con los siguientes detalles:</p>
                        <ul>
                            <li><b>Sala:</b> {sala.Salas}</li>
                            <li><b>Fecha:</b> {fecha}</li>
                            <li><b>Hora:</b> {horaInicio} - {horaFin}</li>
                            <li><b>Cargo:</b> {empleado.CargoNavigation?.Cargo}</li>
                        </ul>
                        <p>Si no realizaste esta reserva, por favor comunícate con el área de sistemas.</p>
                        <hr/>
                        <p style='font-size:12px;color:gray;'>Este mensaje fue generado automáticamente por el sistema de reservas de salas PROSEAR / INCREAR.</p>
                    </body>"
                    };

                    mail.To.Add(new MailAddress(empleado.Email));
                    mail.Priority = MailPriority.High;

                    await smtp.SendMailAsync(mail);
                }

                return reserva;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error SMTP: " + ex.ToString());
                throw new Exception($"Error al enviar correo de confirmación: {ex.Message}");
            }
            //return reserva;
        }



        public async Task<TReserva?> UpdateAsync(TReserva reserva)
        {
            var existing = await _context.TReservas.FindAsync(reserva.IdReserva);
            if (existing == null) return null;

            existing.Estado = reserva.Estado;

            
            await _context.SaveChangesAsync();
            return existing;
        }
    }
}
