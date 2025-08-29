# Image Ingestion Analytics & Explorer - HTML App

A comprehensive single-page web application for analyzing and exploring image ingestion data with interactive visualizations and image exploration capabilities.

## 🚀 Features

### 📊 Analytics Tab
- **Eligibility Analysis**: Stacked bar chart showing eligible vs not eligible counts per ingestion query
- **Store Rank Distribution**: Visual representation of store rank distribution across predefined ranges
- **Summary Tables**: Detailed data tables with counts and percentages
- **Interactive Charts**: Built with Chart.js for responsive and interactive visualizations

### 🔍 Explorer Tab
- **Store Rank Explorer**: Filter and explore images by store rank with histogram visualization
- **Query → Image View**: Browse images by ingestion query with advanced filtering options
- **Image Grid**: Responsive grid layout with image thumbnails and metadata
- **Real-time Filtering**: Instant updates as you adjust filters

## 📁 File Structure

```
image_ingestion_analysis/
├── index.html          # Main HTML application
├── styles.css          # CSS styling and responsive design
├── app.js              # JavaScript functionality and data handling
└── [other files...]   # Python analysis scripts
```

## 🎯 CSV Schema Support

The app is designed to work with CSV files containing exactly these 8 columns:

| Column | Description | Type |
|--------|-------------|------|
| `alle_ingestion_id` | Unique identifier for ingestion | String |
| `alle_media_key` | Media key identifier | String |
| `ingestion_query` | Original ingestion query | String |
| `store_rank` | Store ranking value | Integer |
| `syn_con_image_selection` | Synthetic content flag | Integer |
| `brisque_score` | Image quality score | Float |
| `eligible` | Eligibility status | String ('eligible' \| 'not eligible') |
| `image_url` | URL to original image | String |

## 🚀 Getting Started

### 1. Open the Application
Simply open `index.html` in any modern web browser. No server setup required!

### 2. Load Your CSV Data
- Click "📁 Choose CSV File" button
- Select your CSV file with the required schema
- The app will automatically parse and load your data

### 3. Explore Analytics
- **Analytics Tab**: View eligibility statistics and store rank distributions
- **Explorer Tab**: Filter and browse individual images with metadata

## 📊 Analytics Features

### Eligibility Analysis
- **Stacked Bar Chart**: X-axis shows ingestion queries, bars show eligible vs not eligible counts
- **Summary Table**: Detailed breakdown with counts, totals, and percentages
- **Color Coding**: Green for eligible, red for not eligible

### Store Rank Distribution
- **Predefined Ranges**: <10, <30, <50, <70, <100, ≥100
- **Grouped Bar Chart**: Visual representation per ingestion query
- **Data Table**: Absolute counts for each range

## 🔍 Explorer Features

### Store Rank Explorer
- **Exact Rank Input**: Enter specific store rank values
- **Range Filters**: Quick selection of predefined ranges
- **Count Display**: Real-time count of matching images
- **Histogram**: Distribution visualization of filtered results
- **Image Grid**: Paginated display of matching images

### Query → Image View
- **Query Dropdown**: Select specific ingestion queries
- **Store Rank Filters**: Apply range-based filtering
- **Brisque Score Filter**: Set maximum quality score threshold
- **Syn Con Toggle**: Filter for synthetic content images only
- **Responsive Grid**: Image cards with metadata display

## 🎨 User Experience Features

### Responsive Design
- **Mobile Optimized**: Works seamlessly on all device sizes
- **Adaptive Layout**: Grids and charts adjust to screen dimensions
- **Touch Friendly**: Optimized for touch and mouse interactions

### Performance Optimizations
- **Efficient Data Handling**: Processes large datasets (50k+ rows) smoothly
- **Debounced Inputs**: Prevents excessive filtering during typing
- **Pagination**: Loads images in manageable chunks
- **Lazy Loading**: Images load as needed

### State Persistence
- **Local Storage**: Remembers your current tab and view preferences
- **Session Recovery**: Restores state when refreshing the page
- **Filter Memory**: Maintains filter selections across sessions

## 🛠️ Technical Implementation

### Frontend Technologies
- **HTML5**: Semantic markup and modern structure
- **CSS3**: Flexbox, Grid, and responsive design
- **Vanilla JavaScript**: No framework dependencies
- **Chart.js**: Professional chart visualizations
- **Papa Parse**: Fast CSV parsing

### Data Handling
- **Client-side Processing**: All analysis happens in the browser
- **Memory Efficient**: Optimized for large datasets
- **Real-time Updates**: Instant filter results
- **Error Handling**: Graceful handling of malformed data

## 📱 Browser Compatibility

- **Chrome**: 80+ (Recommended)
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile 80+

## 🔧 Customization

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- CSS variables for easy theme customization
- Responsive breakpoints for different screen sizes

### Functionality
- Edit `app.js` to add new chart types or filters
- Extend data processing logic for additional analytics
- Add new visualization options

### Data Processing
- Modify filter logic in the JavaScript functions
- Add new aggregation methods
- Customize chart configurations

## 📈 Performance Tips

### For Large Datasets
- **Filter Early**: Apply filters before processing large amounts of data
- **Use Range Filters**: Predefined ranges are faster than custom inputs
- **Pagination**: Browse images in smaller chunks
- **Browser Memory**: Close other tabs for optimal performance

### Optimization Features
- **Debounced Inputs**: 300ms delay prevents excessive filtering
- **Efficient DOM Updates**: Minimal re-rendering of charts and tables
- **Memory Management**: Charts are properly destroyed and recreated

## 🐛 Troubleshooting

### Common Issues
1. **CSV Not Loading**: Check file format and column names
2. **Charts Not Displaying**: Ensure Chart.js is loaded properly
3. **Slow Performance**: Reduce dataset size or use more specific filters
4. **Images Not Loading**: Check image URLs and network connectivity

### Debug Mode
- Open browser developer tools (F12)
- Check console for error messages
- Monitor network tab for failed requests
- Verify data structure in application state

## 🚀 Future Enhancements

### Planned Features
- **Export Functionality**: Download filtered results as CSV
- **Advanced Charts**: Scatter plots, heatmaps, and trend analysis
- **Data Comparison**: Side-by-side analysis of different datasets
- **Custom Filters**: User-defined filter combinations
- **Image Previews**: Lightbox for full-size image viewing

### Integration Possibilities
- **API Integration**: Connect to live data sources
- **Database Connectivity**: Direct database queries
- **Real-time Updates**: Live data streaming
- **Collaboration**: Share analysis sessions

## 📞 Support

### Getting Help
1. **Check Console**: Browser developer tools for error messages
2. **Verify Data**: Ensure CSV format matches required schema
3. **Browser Compatibility**: Test in recommended browsers
4. **Performance**: Monitor memory usage with large datasets

### Contributing
- Report bugs and feature requests
- Submit improvements and optimizations
- Share custom chart configurations
- Help with documentation and examples

---

**Ready to analyze your image ingestion data?** Simply open `index.html` and start exploring! 🎉 