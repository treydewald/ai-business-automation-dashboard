export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export class ImageOptimizer {
  static generateImageSizes(baseUrl: string, maxWidth: number = 1200): string[] {
    const sizes = [320, 640, 960, 1200, 1920];
    return sizes
      .filter((size) => size <= maxWidth)
      .map((size) => `${baseUrl}?w=${size}`);
  }

  static generateSrcSet(
    baseUrl: string,
    maxWidth: number = 1200
  ): string {
    return this.generateImageSizes(baseUrl, maxWidth)
      .map((url, index) => {
        const sizes = [320, 640, 960, 1200, 1920];
        return `${url} ${sizes[index]}w`;
      })
      .join(", ");
  }

  static shouldLazyLoad(imageElement: HTMLImageElement): boolean {
    return "IntersectionObserver" in window;
  }

  static enableLazyLoading(): void {
    if ("IntersectionObserver" in window) {
      const imageElements = document.querySelectorAll("img[data-lazy]");

      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || "";
            img.srcset = img.dataset.srcset || "";
            img.removeAttribute("data-lazy");
            observer.unobserve(img);
          }
        });
      });

      imageElements.forEach((img) => imageObserver.observe(img));
    }
  }

  static optimizeBundle(): void {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        this.enableLazyLoading();
      });
    } else {
      setTimeout(() => {
        this.enableLazyLoading();
      }, 2000);
    }
  }
}

export function OptimizedImage({
  src,
  alt,
  maxWidth = 1200,
  ...props
}: {
  src: string;
  alt: string;
  maxWidth?: number;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const srcSet = ImageOptimizer.generateSrcSet(src, maxWidth);

  return (
    <img
      {...props}
      src={src}
      srcSet={srcSet}
      alt={alt}
      loading="lazy"
      className={props.className || "object-cover"}
    />
  );
}
