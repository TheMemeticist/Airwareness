import Stats from 'three/examples/jsm/libs/stats.module';

export class PerformanceMonitor {
  constructor() {
    this.stats = new Stats();
    this.metrics = {
      fps: [],
      memory: [],
      renderTime: [],
      timestamps: [],
      memoryLeaks: []
    };
    
    this.startTime = Date.now();
    
    // Configure stats panels
    this.stats.showPanel(0); // FPS
    this.stats.showPanel(1); // MS
    this.stats.showPanel(2); // MB

    // Style the stats panel
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = '0px';
    this.stats.dom.style.left = '0px';
  }

  start() {
    const startTime = performance.now();
    this.stats.begin();
    return startTime;
  }

  end(startTime) {
    this.stats.end();
    const endTime = performance.now();
    
    // Record metrics
    try {
      // Safely get FPS - fallback to calculating it manually if stats panel isn't available
      let currentFPS;
      if (this.stats.panels && this.stats.panels[0]) {
        currentFPS = this.stats.panels[0].fps;
      } else {
        // Calculate FPS manually based on frame time
        const frameTime = endTime - startTime;
        currentFPS = frameTime > 0 ? 1000 / frameTime : 60;
      }
      
      this.metrics.fps.push(currentFPS);
      this.metrics.renderTime.push(endTime - startTime);
      
      if (window.performance && window.performance.memory) {
        this.metrics.memory.push(window.performance.memory.usedJSHeapSize / 1048576); // Convert to MB
      }
    } catch (error) {
      console.warn('Error recording performance metrics:', error);
    }
  }

  attach(container) {
    container.appendChild(this.stats.dom);
  }

  detach() {
    if (this.stats.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom);
    }
  }

  getAverageMetrics() {
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = arr => Math.max(...arr);
    const min = arr => Math.min(...arr);
    
    return {
      averageFPS: avg(this.metrics.fps).toFixed(2),
      averageRenderTime: avg(this.metrics.renderTime).toFixed(2),
      averageMemory: avg(this.metrics.memory).toFixed(2),
      peakMemory: max(this.metrics.memory).toFixed(2),
      lowestFPS: min(this.metrics.fps).toFixed(2),
      highestFPS: max(this.metrics.fps).toFixed(2),
      samples: this.metrics.fps.length,
      runningTime: ((Date.now() - this.startTime) / 1000).toFixed(2) + 's'
    };
  }

  logMetrics() {
    const metrics = this.getAverageMetrics();
    console.group('Performance Monitor Metrics');
    console.table({
      'Average FPS': metrics.averageFPS,
      'Lowest FPS': metrics.lowestFPS,
      'Highest FPS': metrics.highestFPS,
      'Average Render Time (ms)': metrics.averageRenderTime,
      'Average Memory Usage (MB)': metrics.averageMemory,
      'Peak Memory Usage (MB)': metrics.peakMemory,
      'Sample Count': metrics.samples,
      'Total Running Time': metrics.runningTime
    });
    
    // Log potential performance warnings
    if (metrics.lowestFPS < 30) {
      console.warn('Performance Warning: FPS dropped below 30');
    }
    if (metrics.averageRenderTime > 16.67) { // 60 FPS threshold
      console.warn('Performance Warning: Average render time exceeds 16.67ms (60 FPS threshold)');
    }
    console.groupEnd();
  }
} 