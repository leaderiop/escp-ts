#!/bin/bash
# Don't use set -e as imagemagick warnings can cause exit codes

# ESC/P2 PRN to PDF/PNG converter using PrinterToPDF
# Usage:
#   docker run -v "$PWD:/work" escp2pdf <input.prn> [options]
#   docker run -v "$PWD:/work" escp2pdf --batch <directory> [options]
#
# Options:
#   --png           Convert to PNG (in addition to PDF)
#   --dpi <num>     DPI for PNG conversion (default: 150)
#   --output <dir>  Output directory (default: same as input)
#   --9pin          Use 9-pin ESC/P mode (for older printers)
#   --page <size>   Page size: a4, a4-landscape, letter, or WxH in mm
#   --help          Show this help

FONT_DIR="/usr/local/share/PrinterToPDF/font2"
FONT_FILE="$FONT_DIR/Epson-Standard.C16"

# Default options
OUTPUT_PNG=false
DPI=150
OUTPUT_DIR=""
NINE_PIN=""
PAGE_SIZE="-p 0"  # A4 portrait
INPUT_FILE=""
BATCH_MODE=false
BATCH_DIR=""

show_help() {
    echo "ESC/P2 PRN to PDF/PNG Converter (24-pin EPSON LQ-2090II compatible)"
    echo ""
    echo "Usage:"
    echo "  escp2pdf <input.prn> [options]"
    echo "  escp2pdf --batch <directory> [options]"
    echo ""
    echo "Options:"
    echo "  --png             Also convert to PNG"
    echo "  --dpi <num>       DPI for PNG (default: 150)"
    echo "  --output <dir>    Output directory"
    echo "  --9pin            Use 9-pin ESC/P mode (default: 24-pin ESC/P2)"
    echo "  --page <size>     Page size (see below)"
    echo "  --help            Show this help"
    echo ""
    echo "Page sizes:"
    echo "  a4                A4 portrait (210x297mm)"
    echo "  a4-landscape      A4 landscape (297x210mm)"
    echo "  letter            US Letter (8.5x11in)"
    echo "  lq2090            EPSON LQ-2090II wide (377x217mm / 1069x615pt)"
    echo "  lq2090-long       EPSON LQ-2090II long (377x559mm / 14.85x22in)"
    echo "  WxH               Custom size in mm (e.g., 377,217)"
    echo ""
    echo "Examples:"
    echo "  escp2pdf input.prn --page lq2090"
    echo "  escp2pdf input.prn --png --dpi 300 --page lq2090"
    echo "  escp2pdf --batch ./output --png --page lq2090"
    echo "  escp2pdf input.prn --page 377,217"
    echo ""
    echo "Output:"
    echo "  Creates <basename>.pdf (and <basename>.png if --png specified)"
    echo "  Multi-page documents create <basename>_page_N.pdf"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --png)
            OUTPUT_PNG=true
            shift
            ;;
        --dpi)
            DPI="$2"
            shift 2
            ;;
        --output|-o)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --9pin)
            NINE_PIN="-9"
            shift
            ;;
        --page)
            case $2 in
                a4)
                    PAGE_SIZE="-p 0"
                    ;;
                a4-landscape)
                    PAGE_SIZE="-p 1"
                    ;;
                letter)
                    PAGE_SIZE="-p 215.9,279.4"
                    ;;
                lq2090)
                    # EPSON LQ-2090II: 1069x615 points = 377.11x216.96mm
                    PAGE_SIZE="-p 377,217"
                    ;;
                lq2090-long)
                    # EPSON LQ-2090II long: 14.85" x 22" = 377x559mm
                    PAGE_SIZE="-p 377,559"
                    ;;
                *)
                    PAGE_SIZE="-p $2"
                    ;;
            esac
            shift 2
            ;;
        --batch)
            BATCH_MODE=true
            BATCH_DIR="$2"
            shift 2
            ;;
        -*)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            INPUT_FILE="$1"
            shift
            ;;
    esac
done

convert_file() {
    local input="$1"
    local output_dir="$2"

    if [[ ! -f "$input" ]]; then
        echo "Error: File not found: $input"
        return 1
    fi

    local basename=$(basename "$input" .prn)

    echo "Converting: $input"

    # Create temp directory for PrinterToPDF output
    local temp_dir=$(mktemp -d)

    # Run PrinterToPDF (it creates pdf/, png/, eps/ subdirectories)
    printerToPDF \
        -o "$temp_dir/" \
        -f "$FONT_FILE" \
        $PAGE_SIZE \
        $NINE_PIN \
        -q \
        "$input" 2>/dev/null || true

    # Move PDF files from temp_dir/pdf/ to output directory
    if [[ -d "$temp_dir/pdf" ]]; then
        local pdf_files=("$temp_dir/pdf"/*.pdf)
        if [[ -f "${pdf_files[0]}" ]]; then
            local count=${#pdf_files[@]}
            if [[ $count -eq 1 ]]; then
                # Single page - rename to basename.pdf
                cp "${pdf_files[0]}" "$output_dir/${basename}.pdf" 2>/dev/null || true
                echo "  -> $output_dir/${basename}.pdf"

                # Convert to PNG if requested
                if [[ "$OUTPUT_PNG" == "true" ]]; then
                    convert -density "$DPI" "$output_dir/${basename}.pdf" -quality 100 "$output_dir/${basename}.png" 2>/dev/null
                    echo "  -> $output_dir/${basename}.png (${DPI} DPI)"
                fi
            else
                # Multiple pages - keep numbered format
                local page_num=1
                for f in "${pdf_files[@]}"; do
                    local page_name=$(printf "${basename}_page_%03d.pdf" $page_num)
                    cp "$f" "$output_dir/$page_name" 2>/dev/null || true
                    echo "  -> $output_dir/$page_name"

                    if [[ "$OUTPUT_PNG" == "true" ]]; then
                        local png_name=$(printf "${basename}_page_%03d.png" $page_num)
                        convert -density "$DPI" "$output_dir/$page_name" -quality 100 "$output_dir/$png_name" 2>/dev/null
                        echo "  -> $output_dir/$png_name (${DPI} DPI)"
                    fi
                    ((page_num++))
                done
            fi
        else
            echo "  Warning: No PDF output generated"
        fi
    else
        echo "  Warning: No PDF output generated"
    fi

    rm -rf "$temp_dir"
}

# Main execution
if [[ "$BATCH_MODE" == "true" ]]; then
    if [[ -z "$BATCH_DIR" ]]; then
        echo "Error: Batch mode requires a directory"
        exit 1
    fi

    OUTPUT_DIR="${OUTPUT_DIR:-$BATCH_DIR}"
    mkdir -p "$OUTPUT_DIR"

    count=0
    for prn_file in "$BATCH_DIR"/*.prn; do
        if [[ -f "$prn_file" ]]; then
            convert_file "$prn_file" "$OUTPUT_DIR"
            ((count++))
        fi
    done

    echo ""
    echo "Converted $count file(s)"
else
    if [[ -z "$INPUT_FILE" ]]; then
        echo "Error: No input file specified"
        show_help
        exit 1
    fi

    # Determine output directory
    if [[ -z "$OUTPUT_DIR" ]]; then
        OUTPUT_DIR=$(dirname "$INPUT_FILE")
    fi
    mkdir -p "$OUTPUT_DIR"

    convert_file "$INPUT_FILE" "$OUTPUT_DIR"
fi
