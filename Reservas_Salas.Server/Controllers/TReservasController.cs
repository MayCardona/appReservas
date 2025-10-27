using Humanizer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.DTOs;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;

namespace Reservas_Salas.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TReservasController : ControllerBase
    {
        private readonly ITReservaService _reservaservice;

        public TReservasController(ITReservaService reservaservice)
        {
            _reservaservice = reservaservice;
        }

        // GET: api/TReservas
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var reservas = await _reservaservice.GetAllAsync();

            return Ok(reservas);
        }

        //  GET: api/TReservas/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var reserva = await _reservaservice.GetByIdAsync(id);
                

            if (reserva == null)
                return NotFound();

            return Ok(reserva);
        }

        //get/employee/id
        [HttpGet("employee-id/{id}")]
        public async Task<IActionResult> GetByEmployeeId(long id)
        {
            var reservas = await _reservaservice.GetByEmployeeIdAsync(id);

            if (reservas == null || !reservas.Any())
                return NotFound("El empleado no tiene reservas registradas");

            return Ok(reservas);
        }

        // GET: api/TReservas/sala/1/fecha/2025-10-06
        [HttpGet("sala/{idSala}/fecha/{fecha}")]
        public async Task<IActionResult> GetReservasPorSalaYFecha(long idSala, DateTime fecha)
        {
            var reservas = await _reservaservice.GetReservasPorSalaYFechaAsync(idSala, fecha);
            return Ok(reservas);
        }

        //  POST: api/TReservas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TReservaDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var reserva = new TReserva
            {
                IdSala = dto.IdSala,
                IdEmpleado = dto.IdEmpleado,
                FechaInicio = dto.FechaInicio,
                FechaFin = dto.FechaFin,
                Estado = dto.Estado,
                Observaciones = dto.Observaciones
            };

            await _reservaservice.CreateAsync(reserva);
            

            return Ok(dto);
        }

        //  PUT: api/TReservas/5
        [HttpPut]
        public async Task<IActionResult> Update([FromBody]UpdateReservaDTO dto)
        {
            var updated = new TReserva
            {
                IdReserva = dto.IdReserva,
                Estado = dto.Estado
            };
            await _reservaservice.UpdateAsync(updated);

            return Ok(new
            {
                success = true,
                Message = "Reserva cancelada Correctamente"

            });
        }


    }
}