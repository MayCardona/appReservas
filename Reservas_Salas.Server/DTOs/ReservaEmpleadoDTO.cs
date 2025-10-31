namespace Reservas_Salas.Server.DTOs
{
    public class ReservaEmpleadoDTO
    {
        public long IdReserva { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public long IdSala { get; set; }
        public string NombreSala { get; set; } = string.Empty;
        public int Estado {  get; set; }
        public string Observaciones { get; set; }
    }
}
