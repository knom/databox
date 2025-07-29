using System;

namespace Databox.Models
{
    public class Submission
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = Guid.NewGuid().ToString();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool Claimed { get; set; } = false;
    }
}
