
import React, { useEffect, useRef } from 'react';
import type { DomainScore } from '../types';
import { useTheme } from '../contexts/ThemeContext';

// Chart.js is loaded from a script tag in index.html, making it a global variable.
declare var Chart: any;

interface ChartProps {
  data: { [key: string]: DomainScore };
}

const CommonChartOptions = (theme: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 20,
                color: theme === 'dark' ? '#94a3b8' : '#475569',
                font: { family: 'Tajawal, sans-serif', size: 12 }
            }
        },
        tooltip: {
            bodyFont: { family: 'Tajawal, sans-serif' },
            titleFont: { family: 'Tajawal, sans-serif' },
            backgroundColor: theme === 'dark' ? 'rgba(24, 24, 27, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: theme === 'dark' ? '#fff' : '#0f172a',
            bodyColor: theme === 'dark' ? '#cbd5e1' : '#334155',
            borderColor: theme === 'dark' ? '#3f3f46' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6
        }
    }
});

const RadarChart: React.FC<ChartProps> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (canvasRef.current) {
            if (chartRef.current) chartRef.current.destroy();
            const ctx = canvasRef.current.getContext('2d');
            const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(71, 85, 105, 0.2)';
            const pointColor = theme === 'dark' ? '#fff' : '#0f172a';
            
            // Detect mobile screen for specific adjustments
            const isMobile = window.innerWidth < 768;
            const fontSize = isMobile ? 9 : 12; // Smaller font for mobile
            const padding = isMobile ? 10 : 20;

            if (ctx) {
                // Split long labels into multiple lines for mobile
                const labels = Object.values(data).map((d: DomainScore) => {
                    const text = d.title;
                    // If text is long, split it
                    if (text.length > 15 && text.includes(' ')) {
                         const words = text.split(' ');
                         const mid = Math.ceil(words.length / 2);
                         return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                    }
                    return text;
                });

                const scores = Object.values(data).map((d: DomainScore) => d.score);
                
                chartRef.current = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'مستوى النضج',
                            data: scores,
                            backgroundColor: 'rgba(74, 56, 86, 0.4)',
                            borderColor: '#4a3856',
                            borderWidth: isMobile ? 2 : 3,
                            pointBackgroundColor: pointColor,
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: pointColor,
                            pointRadius: isMobile ? 3 : 4,
                        }]
                    },
                    options: {
                        ...CommonChartOptions(theme),
                        layout: {
                            padding: padding // Dynamic padding
                        },
                        plugins: {
                            ...CommonChartOptions(theme).plugins,
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            r: {
                                angleLines: { color: gridColor },
                                grid: { color: gridColor },
                                pointLabels: {
                                    color: theme === 'dark' ? '#cbd5e1' : '#475569',
                                    font: { family: 'Tajawal, sans-serif', size: fontSize, weight: 'bold' },
                                    padding: isMobile ? 5 : 10
                                },
                                ticks: { 
                                    display: false, 
                                    backdropColor: 'transparent',
                                    stepSize: 5
                                },
                                min: 0,
                                max: 25,
                            }
                        }
                    }
                });
            }
        }
        return () => chartRef.current?.destroy();
    }, [data, theme]);

    return <canvas ref={canvasRef}></canvas>;
};

const ResultsChart: React.FC<ChartProps> = ({ data }) => {
    return (
        <div className="flex flex-col h-full w-full items-center justify-center py-2 px-2 md:px-0">
            <div className="relative w-full h-full min-h-[300px] md:min-h-[350px] flex items-center justify-center">
                <RadarChart data={data} />
            </div>
        </div>
    );
}

export default ResultsChart;
