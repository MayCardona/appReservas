using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Reservas_Salas.Server.Data;
using Reservas_Salas.Server.Models;
using Reservas_Salas.Server.Services.Interfaces;

namespace Reservas_Salas.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TEmpleadosController : ControllerBase
    {
        private readonly ITEmpleadoService _empleadoService;

        public TEmpleadosController(ITEmpleadoService empleadoService)
        {
            _empleadoService = empleadoService;
        }

        //  GET: api/TEmpleados (QUITAR DESPUES DE TERMINAR)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var empleados = await _empleadoService.GetAllAsync();

            return Ok(empleados);
        }

        //  GET: api/TEmpleados/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var tEmpleado = await _empleadoService.GetByIdAsync(id);

            if (tEmpleado == null)
                return NotFound();

            return Ok(tEmpleado);
        }

        
    }
}