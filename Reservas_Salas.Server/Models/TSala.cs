using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Reservas_Salas.Server.Models;

[Table("T_Salas")]
public partial class TSala
{
    [Key]
    public long IdSala { get; set; }

    [StringLength(50)]
    public string? Salas { get; set; }

    public int Reservado { get; set; }

    [InverseProperty("IdSalaNavigation")]
    public virtual ICollection<TReserva> TReservas { get; set; } = new List<TReserva>();
}
