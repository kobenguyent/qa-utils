import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

export const LocalLlmMacTips = () => {
  return (
    <Container className="py-4">
      <div className="tool-header">
        <div className="tool-header-icon">🍎</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Local LLM on Mac (16 GB RAM)</h1>
          <p className="tool-header-desc">
            Practical tips for running large language models efficiently on a Mac with 16 GB RAM — including model selection, swap tuning, and production-ready Ollama configuration
          </p>
        </div>
      </div>

      {/* Why it works on Apple Silicon */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h2 className="h4">Why Apple Silicon Handles This Well</h2>
              <p>
                Apple Silicon (M1/M2/M3/M4) uses a <strong>unified memory architecture</strong> — the same RAM pool is shared between CPU, GPU, and the Neural Engine.
                This means the GPU can access model weights directly without PCIe bus transfers, giving you much better throughput per GB than a discrete-GPU setup.
                Combined with Apple&apos;s fast NVMe SSDs, swap space is also significantly faster than on x86 machines, making it practical to run models that slightly exceed physical RAM.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Model selection */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 border-success">
            <Card.Header className="bg-success text-white">
              <h3 className="h5 mb-0">✅ Recommended Models for 16 GB RAM</h3>
            </Card.Header>
            <Card.Body>
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Quant</th>
                    <th>VRAM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Gemma 3 4B</strong></td>
                    <td><Badge bg="success">Q8</Badge></td>
                    <td>~5 GB</td>
                  </tr>
                  <tr>
                    <td><strong>Gemma 3 12B</strong></td>
                    <td><Badge bg="primary">Q4_K_M</Badge></td>
                    <td>~8 GB</td>
                  </tr>
                  <tr>
                    <td><strong>Llama 3.1 8B</strong></td>
                    <td><Badge bg="primary">Q4_K_M</Badge></td>
                    <td>~5 GB</td>
                  </tr>
                  <tr>
                    <td><strong>Mistral 7B</strong></td>
                    <td><Badge bg="primary">Q4_K_M</Badge></td>
                    <td>~5 GB</td>
                  </tr>
                  <tr>
                    <td><strong>Phi-3 Mini 3.8B</strong></td>
                    <td><Badge bg="success">Q8</Badge></td>
                    <td>~4 GB</td>
                  </tr>
                  <tr>
                    <td><strong>Gemma 3 27B</strong></td>
                    <td><Badge bg="warning" text="dark">Q4_K_M</Badge></td>
                    <td>~17 GB (swap)</td>
                  </tr>
                  <tr>
                    <td><strong>Llama 3.3 70B</strong></td>
                    <td><Badge bg="danger">IQ2_XS</Badge></td>
                    <td>~25 GB (swap)</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-muted small mt-2 mb-0">Models in yellow/red require swap. Performance is acceptable on Mac Mini M4 Pro+ with fast SSD, but not recommended for latency-sensitive apps.</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-danger">
            <Card.Header className="bg-danger text-white">
              <h3 className="h5 mb-0">❌ Models to Avoid on 16 GB RAM</h3>
            </Card.Header>
            <Card.Body>
              <ul>
                <li><strong>Any 70B+ model at Q4 or higher</strong> — too much swap, very slow tokens/s</li>
                <li><strong>Unconstrained context windows</strong> — KV-cache blows up RAM fast; always cap <code>num_ctx</code></li>
                <li><strong>Multiple models loaded simultaneously</strong> — unload before loading a different model</li>
                <li><strong>FP16 / FP32 weights</strong> — always prefer GGUF quantized formats over full-precision HuggingFace checkpoints</li>
              </ul>
              <p className="text-muted small mb-0">Tip: check actual RAM usage with <code>Activity Monitor → Memory Pressure</code>. If pressure is red, your tokens/s will drop significantly.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ollama tips */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h3 className="h5 mb-0">🦙 Ollama Configuration Tips</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h4 className="h6">Key Environment Variables</h4>
                  <pre className="bg-body-secondary rounded p-3 small">{`# Increase GPU layers (use all on Apple Silicon)
OLLAMA_NUM_GPU=999

# Cap context to save RAM (default 2048)
OLLAMA_NUM_CTX=4096

# Keep model loaded between requests (seconds)
OLLAMA_KEEP_ALIVE=300

# Limit parallel request slots
OLLAMA_NUM_PARALLEL=1

# Set in ~/.zshrc or as launchd env vars`}</pre>
                </Col>
                <Col md={6}>
                  <h4 className="h6">Modelfile Overrides</h4>
                  <pre className="bg-body-secondary rounded p-3 small">{`FROM gemma3:12b

# Limit context window to save KV-cache RAM
PARAMETER num_ctx 4096

# Use all available GPU layers
PARAMETER num_gpu 999

# Threads = performance cores only
PARAMETER num_thread 6

# No mmap for loaded models — avoids swap thrash
PARAMETER use_mmap false`}</pre>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Swap tuning */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 border-warning">
            <Card.Header className="bg-warning">
              <h3 className="h5 mb-0">💾 macOS Swap Tuning</h3>
            </Card.Header>
            <Card.Body>
              <p>Apple Silicon Macs dynamically manage swap on the internal SSD. A few things to keep in mind:</p>
              <ul>
                <li>The SSD on M-series chips can sustain <strong>~5–7 GB/s reads</strong>, making swap tolerable for inference (not ideal, but usable).</li>
                <li>Check swap usage: <code>sysctl vm.swapusage</code></li>
                <li>Reduce background memory pressure before running inference — quit browsers and Electron apps.</li>
                <li>On Mac Mini M4 (base 16 GB), a 35B model at <strong>IQ3_XS</strong> uses ~20 GB total, so ~4 GB spills to swap. Expect ~4–8 tokens/s.</li>
                <li>For 24/7 production use, prefer models that <strong>fit entirely in physical RAM</strong> to avoid SSD wear.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h3 className="h5 mb-0">📊 Typical Throughput on Mac Mini M4 (16 GB)</h3>
            </Card.Header>
            <Card.Body>
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Quant</th>
                    <th>tok/s</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gemma 3 4B</td>
                    <td>Q8</td>
                    <td className="text-success">~65</td>
                  </tr>
                  <tr>
                    <td>Gemma 3 12B</td>
                    <td>Q4_K_M</td>
                    <td className="text-success">~35</td>
                  </tr>
                  <tr>
                    <td>Llama 3.1 8B</td>
                    <td>Q4_K_M</td>
                    <td className="text-success">~55</td>
                  </tr>
                  <tr>
                    <td>Gemma 3 27B</td>
                    <td>Q4_K_M</td>
                    <td className="text-warning">~8 (swap)</td>
                  </tr>
                  <tr>
                    <td>Gemma 3 27B</td>
                    <td>IQ3_XS</td>
                    <td className="text-warning">~12 (swap)</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-muted small mt-2 mb-0">Figures are approximate decode speed (tok/s). Prompt-processing speed is typically 2–4× faster.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* llama.cpp direct */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">⚡ llama.cpp Direct (Lower Overhead than Ollama)</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h4 className="h6">Build & Run</h4>
                  <pre className="bg-body-secondary rounded p-3 small">{`# Install via Homebrew (Metal enabled by default)
brew install llama.cpp

# Run a GGUF model directly
llama-cli \\
  -m ~/models/gemma-3-12b-q4_k_m.gguf \\
  --n-gpu-layers 999 \\
  --ctx-size 4096 \\
  --threads 6 \\
  -p "Your prompt here" \\
  -n 512`}</pre>
                </Col>
                <Col md={6}>
                  <h4 className="h6">Run as OpenAI-Compatible Server</h4>
                  <pre className="bg-body-secondary rounded p-3 small">{`llama-server \\
  -m ~/models/gemma-3-12b-q4_k_m.gguf \\
  --n-gpu-layers 999 \\
  --ctx-size 4096 \\
  --port 8080 \\
  --parallel 1 \\
  --flash-attn

# Exposes POST /v1/chat/completions
# Compatible with OpenAI SDK and LangChain`}</pre>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Memory management */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h3 className="h5 mb-0">🧹 Free Up RAM Before Inference</h3>
            </Card.Header>
            <Card.Body>
              <ol>
                <li>Quit unused browser tabs (each Chrome tab = ~100–400 MB).</li>
                <li>Quit Slack, Teams, Electron-based apps.</li>
                <li>Purge the macOS disk cache: <code>sudo purge</code> (forces macOS to release inactive memory back to the RAM pool — safe to run, no data is lost)</li>
                <li>Check memory pressure in Activity Monitor — aim for <strong>green</strong> before loading a large model.</li>
                <li>Disable iCloud Drive sync during inference sessions.</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <h3 className="h5 mb-0">🔧 Quantization Cheat Sheet</h3>
            </Card.Header>
            <Card.Body>
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Format</th>
                    <th>Quality</th>
                    <th>Size vs FP16</th>
                    <th>Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Q8_0</td><td>≈ FP16</td><td>50%</td><td>Small models</td></tr>
                  <tr><td>Q5_K_M</td><td>Near-lossless</td><td>37%</td><td>Quality priority</td></tr>
                  <tr><td>Q4_K_M</td><td>Good</td><td>30%</td><td>Best balance</td></tr>
                  <tr><td>IQ3_XS</td><td>Noticeable loss</td><td>22%</td><td>RAM-constrained</td></tr>
                  <tr><td>IQ2_XS</td><td>Degraded</td><td>15%</td><td>70B+ models only</td></tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Production tips */}
      <Row className="mb-4">
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h3 className="h5 mb-0">🚀 Production Deployment Tips</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h4 className="h6">Keep the Model Warm</h4>
                  <p className="small">Set <code>OLLAMA_KEEP_ALIVE=-1</code> (never unload) or use a large positive value like <code>3600</code> so the model stays in RAM between requests. Cold-loading a 12B GGUF takes ~3–5 s.</p>
                </Col>
                <Col md={4}>
                  <h4 className="h6">Limit Concurrency</h4>
                  <p className="small">Set <code>OLLAMA_NUM_PARALLEL=1</code> (or 2 max) to prevent OOM. Queue requests in your app layer rather than running parallel inference on a 16 GB system.</p>
                </Col>
                <Col md={4}>
                  <h4 className="h6">Use Flash Attention</h4>
                  <p className="small">Pass <code>--flash-attn</code> in llama.cpp or set <code>OLLAMA_FLASH_ATTENTION=1</code>. Cuts KV-cache memory by ~2×, which is critical with long contexts on 16 GB.</p>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={4}>
                  <h4 className="h6">SSD Longevity</h4>
                  <p className="small">Excessive swap writes degrade the SSD over time. For 24/7 production use, choose a model that fits in physical RAM — or upgrade to a 32 GB Mac mini.</p>
                </Col>
                <Col md={4}>
                  <h4 className="h6">Monitor with Stats</h4>
                  <pre className="small bg-body-secondary rounded p-2 mb-0">{`# Live metrics
ollama ps
# Memory/swap
vm_stat 1
# GPU usage
sudo powermetrics --samplers gpu_power -i 1000`}</pre>
                </Col>
                <Col md={4}>
                  <h4 className="h6">System Prompt Caching</h4>
                  <p className="small">Reuse the same system prompt across calls to benefit from Ollama&apos;s built-in KV-cache. Changing the system prompt every request defeats the cache and wastes RAM bandwidth.</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick start */}
      <Row className="mb-4">
        <Col>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h3 className="h5 mb-0">🎯 Quick Start: Recommended Setup for 16 GB RAM</h3>
            </Card.Header>
            <Card.Body>
              <pre className="bg-body-secondary rounded p-3 small mb-0">{`# 1. Install Ollama
brew install ollama

# 2. Start Ollama service
ollama serve

# 3. Pull a well-balanced model (fits in RAM, great quality)
ollama pull gemma3:12b           # ~7.3 GB, Q4_K_M by default

# 4. (Optional) Create a tuned Modelfile
cat > Modelfile <<'EOF'
FROM gemma3:12b
PARAMETER num_ctx 4096
PARAMETER num_gpu 999
PARAMETER num_thread 6
PARAMETER use_mmap false
EOF
ollama create gemma3-tuned -f Modelfile

# 5. Run a quick test
ollama run gemma3-tuned "Explain quantization in 2 sentences"

# 6. Use via API (OpenAI-compatible)
curl http://localhost:11434/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gemma3-tuned","messages":[{"role":"user","content":"Hello"}]}'`}</pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* References */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">📚 Further Reading</h3>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0">
                <li><strong>Ollama docs:</strong> <a href="https://ollama.com/docs" target="_blank" rel="noopener noreferrer">ollama.com/docs</a></li>
                <li><strong>llama.cpp:</strong> <a href="https://github.com/ggerganov/llama.cpp" target="_blank" rel="noopener noreferrer">github.com/ggerganov/llama.cpp</a></li>
                <li><strong>GGUF model hub:</strong> <a href="https://huggingface.co/bartowski" target="_blank" rel="noopener noreferrer">huggingface.co/bartowski</a> (pre-quantized GGUF releases)</li>
                <li><strong>Apple MLX framework:</strong> <a href="https://github.com/ml-explore/mlx" target="_blank" rel="noopener noreferrer">github.com/ml-explore/mlx</a> — Apple&apos;s own ML framework, often faster than llama.cpp on Apple Silicon</li>
                <li><strong>LM Studio:</strong> <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer">lmstudio.ai</a> — GUI for managing and running local models</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
