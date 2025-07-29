using Microsoft.EntityFrameworkCore;
using Databox.Models;

namespace Databox.Data
{
    public class DataboxContext : DbContext
    {
        public DataboxContext(DbContextOptions<DataboxContext> options) : base(options) { }

        public DbSet<Submission> Submissions { get; set; }
    }
}
