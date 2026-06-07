import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    category: string;
    author_name: string;
    version: number;
    usage_count: number;
    rating: number;
    review_count: number;
  };
  onImport: () => void;
}

export function TemplateCard({ template, onImport }: TemplateCardProps) {
  const renderRating = (rating: number, reviewCount: number) => {
    if (reviewCount === 0) {
      return <span className="text-xs text-gray-500">No reviews yet</span>;
    }
    return (
      <span className="text-sm font-medium">
        ⭐ {rating.toFixed(1)} ({reviewCount})
      </span>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'success' | 'warning' | 'info' | 'default' } = {
      'Data Processing': 'info',
      'Integration': 'success',
      'Notification': 'warning',
      'Scheduling': 'success',
      'Monitoring': 'warning',
      'Other': 'default',
    };
    return colors[category] || 'default';
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all">
      <div className="space-y-4 flex-1">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {template.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description || 'No description'}
          </p>
        </div>

        {/* Category Badge */}
        <div>
          <Badge variant={getCategoryColor(template.category)}>
            {template.category}
          </Badge>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Author:</span>
            <span className="font-medium">{template.author_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium">v{template.version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Usage:</span>
            <span className="font-medium">{template.usage_count} times</span>
          </div>
        </div>

        {/* Rating */}
        <div className="border-t border-gray-200 pt-3">
          {renderRating(template.rating, template.review_count)}
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={onImport}
        className="w-full mt-4"
      >
        Import Template
      </Button>
    </Card>
  );
}
