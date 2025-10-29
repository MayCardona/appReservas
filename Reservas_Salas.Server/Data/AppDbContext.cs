using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Reservas_Salas.Server.Models;

namespace Reservas_Salas.Server.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<TEmpleado> TEmpleados { get; set; }
    public virtual DbSet<TReserva> TReservas { get; set; }
    public virtual DbSet<TSala> TSalas { get; set; }

    

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=10.254.35.16,1434;Database=INVENTARIO;User Id=UsuarioAGSSA;Password=UsuarioAGSSA*.*;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<TEmpleado>(entity =>
        {
            entity.HasKey(e => e.IdEmpleado).HasName("PK__T_Emplea__CE6D8B9E607EF6B9");

            entity.ToTable("T_Empleados", tb => tb.HasTrigger("UpdateCifrarSueldo"));

            entity.Property(e => e.IdEmpleado).ValueGeneratedNever();

            entity.HasOne(d => d.CargoNavigation).WithMany(p => p.TEmpleados)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__T_Emplead__Cargo_");

            entity.HasOne(d => d.EmpresaNavigation).WithMany(p => p.TEmpleados)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__T_Emplead__Empre_");
        });

        

        modelBuilder.Entity<TReserva>(entity =>
        {
            entity.HasKey(e => e.IdReserva).HasName("PK__T_Reserv__0E49C69DAA68044B");

            entity.Property(e => e.IdReserva).ValueGeneratedOnAdd();

            entity.HasOne(d => d.IdEmpleadoNavigation).WithMany(p => p.TReservas)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__T_Reserva__IdEmp__5FF32EF8");

            entity.HasOne(d => d.IdSalaNavigation).WithMany(p => p.TReservas)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reserva");
        });

        modelBuilder.Entity<TSala>(entity =>
        {
            entity.HasKey(e => e.IdSala).HasName("PK__T_Salas__0EAE85BACD638BE0");

            entity.Property(e => e.IdSala).ValueGeneratedNever();
        });

        

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
