using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Reservas_Salas.Server.Models;

[Table("T_Reservas")]
public partial class TReserva
{
    public long IdReserva { get; set; }

    public long IdSala { get; set; }

    public long IdEmpleado { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime FechaInicio { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime FechaFin { get; set; }
    public int Estado {get;set;}
    
    [Required]
    public string Observaciones { get; set;}

    [ForeignKey("IdEmpleado")]
    [InverseProperty("TReservas")]
    public virtual TEmpleado IdEmpleadoNavigation { get; set; } = null!;

    [ForeignKey("IdSala")]
    [InverseProperty("TReservas")]
    public virtual TSala IdSalaNavigation { get; set; } = null!;
}
