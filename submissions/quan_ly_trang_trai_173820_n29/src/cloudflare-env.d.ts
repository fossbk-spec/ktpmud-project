declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    SAMPLE_EDITOR_CODE?: string;
  }
}
