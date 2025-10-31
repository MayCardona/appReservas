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
        private readonly ISendMailService _mailService;

        public TReservaService(AppDbContext context, ISendMailService mailService)
        {
            _context = context;
            _mailService = mailService;
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
                        Estado = reserva.Estado,
                        Observaciones = reserva.Observaciones
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
                string fecha = reserva.FechaInicio.ToString("dddd, dd MMMM yyyy", new System.Globalization.CultureInfo("es-ES"));
                string horaInicio = reserva.FechaInicio.ToString("HH:mm");
                string horaFin = reserva.FechaFin.ToString("HH:mm");

                MailSenderModel correo = new MailSenderModel();

                correo.email = empleado.Email;
                correo.subject = "Confirmación de reserva de sala - PROSEAR / INCREAR";
                correo.body = $@"
                    <body style='font-family: Arial; color:#333;'>
                        <h2>Confirmación de reserva</h2>
                        <p>Hola <b>{empleado.Nombre} {empleado.Apellido}</b>,</p>
                        <p>Tu reserva se ha registrado exitosamente con los siguientes detalles:</p>
                        <ul>
                            <li><b>Sala:</b> {sala.Salas}</li>
                            <li><b>Fecha:</b> {fecha}</li>
                            <li><b>Hora:</b> {horaInicio} - {horaFin}</li>
                            <li><b>Motivo:</b> {reserva.Observaciones}.</li>
                            <li><b>Cargo:</b> {empleado.CargoNavigation?.Cargo}</li>
                        </ul>
                        <p>Si no realizaste esta reserva, por favor comunícate con el área de Tecnologías.</p>
                        <hr/>
                        <p style='font-size:12px;color:gray;'>Este mensaje fue generado automáticamente por el sistema de reservas de salas PROSEAR / INCREAR.</p>
                    </body>";
                
                await _mailService.SendMailAsync(correo);
                return reserva;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al crear reserva: {ex.Message}");
            }
            //return reserva;
        }



        public async Task<TReserva?> UpdateAsync(TReserva reserva)
        {
            var existing = await _context.TReservas.FindAsync(reserva.IdReserva);
            if (existing == null) return null;

            existing.Estado = reserva.Estado;

            
            await _context.SaveChangesAsync();

            // 🔹 Recuperar los datos completos de la reserva actualizada
            var reservaCompleta = await _context.TReservas
                .Include(r => r.IdEmpleadoNavigation)
                .Include(r => r.IdSalaNavigation)
                .FirstOrDefaultAsync(r => r.IdReserva == reserva.IdReserva);

            if (reservaCompleta == null)
                throw new InvalidOperationException("No se encontró la reserva.");

            var empleado = reservaCompleta.IdEmpleadoNavigation;
            var sala = reservaCompleta.IdSalaNavigation;

            if (empleado == null)
                throw new InvalidOperationException("El empleado no existe.");

            if (sala == null)
                throw new InvalidOperationException("La sala no existe.");

            if (string.IsNullOrEmpty(empleado.Email))
                throw new InvalidOperationException("El empleado no tiene un correo registrado.");

            try
            {
                string fecha = reservaCompleta.FechaInicio.ToString("dddd, dd MMMM yyyy", new System.Globalization.CultureInfo("es-ES"));
                string horaInicio = reservaCompleta.FechaInicio.ToString("HH:mm");
                string horaFin = reservaCompleta.FechaFin.ToString("HH:mm");

                MailSenderModel correo = new MailSenderModel();

                correo.email = empleado.Email;
                correo.subject = "Notificación cancelación de reserva sala - PROSEAR / INCREAR";
                correo.body = $@"
                    <body style='font-family: Arial; color:#333;'>
                        <h2>Cancelación de reserva</h2>
                        <p>Hola <b>{empleado.Nombre} {empleado.Apellido}</b>,</p>
                        <p>Tu reserva se ha cancelado, la cual contaba con los siguientes detalles:</p>
                        <ul>
                            <li><b>Sala:</b> {sala.Salas}</li>
                            <li><b>Fecha:</b> {fecha}</li>
                            <li><b>Hora:</b> {horaInicio} - {horaFin}</li>
                            <li><b>Motivo:</b> {reservaCompleta.Observaciones}.</li>    
                        </ul>
                        <p>Si no realizaste esta reserva, por favor comunícate con el área de Tecnologías.</p>
                        <hr/>
                        <p style='font-size:12px;color:gray;'>Este mensaje fue generado automáticamente por el sistema de reservas de salas PROSEAR / INCREAR.</p>
                    </body>";


                await _mailService.SendMailAsync(correo);
            }
            catch (Exception ex) 
            {
                throw new Exception($"Error al enviar cancelar reserva: {ex.Message}");
            }
            return existing;
        }
    }
}
