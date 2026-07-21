// Client-side data engine for Project 4 Github Pages
window.allData = [];

function getUniqueValues(data, field) {
    const set = new Set();
    for (let i = 0; i < data.length; i++) {
        if (data[i][field]) set.add(data[i][field]);
    }
    return Array.from(set).sort();
}

window.mockApiFilters = function(payload) {
    let filtered = window.allData;
    if (payload.donVi && payload.donVi.length) filtered = filtered.filter(r => payload.donVi.includes(r.donVi));
    if (payload.maTuyenDoc && payload.maTuyenDoc.length) filtered = filtered.filter(r => payload.maTuyenDoc.includes(r.maTuyenDoc));
    if (payload.maPhamVi && payload.maPhamVi.length) filtered = filtered.filter(r => payload.maPhamVi.includes(r.maPhamVi));
    if (payload.mucDich && payload.mucDich.length) filtered = filtered.filter(r => payload.mucDich.includes(r.mucDich));
    if (payload.maDoiTuongGia && payload.maDoiTuongGia.length) filtered = filtered.filter(r => payload.maDoiTuongGia.includes(r.maDoiTuongGia));
    if (payload.nam && payload.nam.length) filtered = filtered.filter(r => payload.nam.includes(r.nam));
    if (payload.thang && payload.thang.length) filtered = filtered.filter(r => payload.thang.includes(r.thang));

    return {
        donVi: getUniqueValues(filtered, 'donVi'),
        maTuyenDoc: getUniqueValues(filtered, 'maTuyenDoc'),
        maPhamVi: getUniqueValues(filtered, 'maPhamVi'),
        mucDich: getUniqueValues(filtered, 'mucDich'),
        maDoiTuongGia: getUniqueValues(filtered, 'maDoiTuongGia'),
        nam: getUniqueValues(filtered, 'nam').sort((a,b)=>b-a),
        thang: getUniqueValues(filtered, 'thang').sort((a,b)=>a-b)
    };
};

window.mockApiQuery = function(payload) {
    let df = window.allData;
    
    if (payload.donVi && payload.donVi.length) df = df.filter(r => payload.donVi.includes(r.donVi));
    if (payload.maTuyenDoc && payload.maTuyenDoc.length) df = df.filter(r => payload.maTuyenDoc.includes(r.maTuyenDoc));
    if (payload.maPhamVi && payload.maPhamVi.length) df = df.filter(r => payload.maPhamVi.includes(r.maPhamVi));
    if (payload.mucDich && payload.mucDich.length) df = df.filter(r => payload.mucDich.includes(r.mucDich));
    if (payload.maDoiTuongGia && payload.maDoiTuongGia.length) df = df.filter(r => payload.maDoiTuongGia.includes(r.maDoiTuongGia));
    if (payload.nam && payload.nam.length) df = df.filter(r => payload.nam.includes(r.nam));
    if (payload.thang && payload.thang.length) df = df.filter(r => payload.thang.includes(r.thang));
    
    if (payload.searchTerm) {
        const term = payload.searchTerm.toLowerCase();
        df = df.filter(r => (r.maKhachHang && r.maKhachHang.toString().toLowerCase().includes(term)) || 
                            (r.tenKhachHang && r.tenKhachHang.toString().toLowerCase().includes(term)));
    }

    let tongSảnLượng = 0, tongThànhTiền = 0, tongVAT = 0, tongPhíBVMT = 0, tongTiền = 0;
    df.forEach(r => {
        tongSảnLượng += r.tieuThu || 0;
        tongThànhTiền += r.thanhTien || 0;
        tongVAT += r.phiVAT || 0;
        tongPhíBVMT += r.phiBVMT || 0;
        tongTiền += r.tongTien || 0;
    });

    let tongKháchHàng = 0;
    if (df.length > 0) {
        const maxThangPerYear = {};
        df.forEach(r => {
            if (!maxThangPerYear[r.nam] || r.thang > maxThangPerYear[r.nam]) {
                maxThangPerYear[r.nam] = r.thang;
            }
        });
        const dfLastMonthYr = df.filter(r => r.thang === maxThangPerYear[r.nam]);
        const uniqueKH = new Set(dfLastMonthYr.map(r => r.maKhachHang));
        tongKháchHàng = uniqueKH.size;
    }

    const summary = {
        tongSảnLượng, tongThànhTiền, tongVAT, tongPhíBVMT, tongTiền,
        tongKháchHàng, tongHóaĐơn: df.length
    };

    let groupCol = payload.groupBy;
    const validGroups = ['donVi', 'maTuyenDoc', 'maPhamVi', 'mucDich', 'maDoiTuongGia', 'nam', 'thang', 'banNien'];
    if (!validGroups.includes(groupCol)) groupCol = 'donVi';
    
    let yoy_metadata = null;
    let stat_grouped = [];
    
    if (df.length > 0) {
        if (groupCol === 'banNien') {
            df = df.map(r => ({...r, banNien: r.thang <= 6 ? '6 Tháng đầu năm (H1)' : '6 Tháng cuối năm (H2)'}));
        }

        let maxThangCache = {};
        if (groupCol === 'banNien') {
            df.forEach(r => {
                const key = r.nam + '_' + r.banNien;
                if (!maxThangCache[key] || r.thang > maxThangCache[key]) maxThangCache[key] = r.thang;
            });
        } else if (groupCol !== 'thang') {
            df.forEach(r => {
                const key = r.nam;
                if (!maxThangCache[key] || r.thang > maxThangCache[key]) maxThangCache[key] = r.thang;
            });
        }

        const groups = {};
        df.forEach(r => {
            const groupKey = groupCol === 'nam' ? r.nam : (r[groupCol] + '|' + r.nam);
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    [groupCol]: r[groupCol],
                    nam: r.nam,
                    tieuThu: 0, thanhTien: 0, tongTien: 0,
                    khSet: new Set()
                };
            }
            groups[groupKey].tieuThu += r.tieuThu || 0;
            groups[groupKey].thanhTien += r.thanhTien || 0;
            groups[groupKey].tongTien += r.tongTien || 0;
            
            let isMaxMonth = false;
            if (groupCol === 'thang') isMaxMonth = true;
            else if (groupCol === 'banNien') isMaxMonth = (r.thang === maxThangCache[r.nam + '_' + r.banNien]);
            else isMaxMonth = (r.thang === maxThangCache[r.nam]);

            if (isMaxMonth) {
                groups[groupKey].khSet.add(r.maKhachHang);
            }
        });

        let stat_df = Object.values(groups).map(g => {
            g.soKhachHang = g.khSet.size;
            delete g.khSet;
            return g;
        });

        if (groupCol !== 'nam') {
            const years = Array.from(new Set(stat_df.map(g => g.nam))).sort((a,b)=>b-a);
            if (years.length >= 2) {
                const year_now = years[0];
                const year_prev = years[1];
                yoy_metadata = { year_now, year_prev };

                const pivot = {};
                stat_df.forEach(g => {
                    const gVal = g[groupCol];
                    if (!pivot[gVal]) pivot[gVal] = { [groupCol]: gVal };
                    
                    if (g.nam === year_now) {
                        pivot[gVal].soKhachHang = g.soKhachHang;
                        pivot[gVal].tieuThu = g.tieuThu;
                        pivot[gVal].thanhTien = g.thanhTien;
                        pivot[gVal].tongTien = g.tongTien;
                    } else if (g.nam === year_prev) {
                        pivot[gVal].soKhachHang_prev = g.soKhachHang;
                        pivot[gVal].tieuThu_prev = g.tieuThu;
                        pivot[gVal].thanhTien_prev = g.thanhTien;
                        pivot[gVal].tongTien_prev = g.tongTien;
                    }
                });
                
                stat_grouped = Object.values(pivot).map(p => {
                    p.soKhachHang = p.soKhachHang || 0;
                    p.tieuThu = p.tieuThu || 0;
                    p.thanhTien = p.thanhTien || 0;
                    p.tongTien = p.tongTien || 0;
                    p.soKhachHang_prev = p.soKhachHang_prev || 0;
                    p.tieuThu_prev = p.tieuThu_prev || 0;
                    p.thanhTien_prev = p.thanhTien_prev || 0;
                    p.tongTien_prev = p.tongTien_prev || 0;
                    if (groupCol === 'thang') p.nam = year_now;
                    return p;
                });
                if (groupCol === 'thang') stat_grouped.sort((a,b) => a[groupCol] - b[groupCol]);
            } else {
                stat_grouped = stat_df.sort((a,b) => {
                    if (a.nam !== b.nam) return a.nam - b.nam;
                    return a[groupCol] < b[groupCol] ? -1 : 1;
                });
            }
        } else {
            stat_grouped = stat_df.sort((a,b) => a.nam - b.nam);
        }
    }

    const limit = payload.limit || 50;
    const offset = payload.offset || 0;
    const detail_records = df.slice(offset, offset + limit);

    return {
        summary,
        grouped_records: stat_grouped,
        detail_records,
        yoy_metadata,
        total_detail: df.length
    };
};

window.mockApiCustomerChanges = function(payload) {
    let df = window.allData;
    if (payload.donVi && payload.donVi.length) df = df.filter(r => payload.donVi.includes(r.donVi));
    
    const dfA = df.filter(r => r.nam === payload.namA && payload.thangA.includes(r.thang));
    const dfB = df.filter(r => r.nam === payload.namB && payload.thangB === r.thang);
    
    // For dfA, group by khachHang, taking max tieuThu (just a proxy for the customer)
    const khA = new Map();
    dfA.forEach(r => {
        if (!khA.has(r.maKhachHang)) khA.set(r.maKhachHang, r);
        else if (r.tieuThu > khA.get(r.maKhachHang).tieuThu) khA.set(r.maKhachHang, r);
    });

    const khB = new Map();
    dfB.forEach(r => {
        if (!khB.has(r.maKhachHang)) khB.set(r.maKhachHang, r);
        else if (r.tieuThu > khB.get(r.maKhachHang).tieuThu) khB.set(r.maKhachHang, r);
    });

    const totalA = khA.size;
    const totalB = khB.size;
    
    const newCustomers = [];
    const reinstatedCustomers = [];
    const cancelledCustomers = [];
    
    khB.forEach((val, key) => {
        if (!khA.has(key)) {
            newCustomers.push(val);
        }
    });

    khA.forEach((val, key) => {
        if (!khB.has(key)) {
            cancelledCustomers.push(val);
        }
    });
    
    return {
        totalA, totalB,
        newCount: newCustomers.length,
        reinstatedCount: reinstatedCustomers.length,
        cancelledCount: cancelledCustomers.length,
        newCustomers: newCustomers.slice(0, 100),
        reinstatedCustomers: reinstatedCustomers.slice(0, 100),
        cancelledCustomers: cancelledCustomers.slice(0, 100)
    };
};

window.clientSideExport = async function(basePayload, currentTab) {
    const filename = currentTab === 'summary' 
        ? `bao_cao_tong_hop_${new Date().toISOString().slice(0,10)}.xlsx` 
        : `bao_cao_chi_tiet_${new Date().toISOString().slice(0,10)}.xlsx`;
        
    let data;
    if (currentTab === 'custchange') {
        const payload = {
            namA: parseInt(document.getElementById('cc-namA').value),
            thangA: activeFilters.cc_thangA,
            namB: parseInt(document.getElementById('cc-namB').value),
            thangB: parseInt(document.getElementById('cc-thangB').value),
            donVi: activeFilters.donVi
        };
        const changes = window.mockApiCustomerChanges(payload);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changes.newCustomers), "KH_Moi");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changes.reinstatedCustomers), "KH_LapLai");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(changes.cancelledCustomers), "KH_Huy");
        XLSX.writeFile(wb, "BaoCao_BienDong_KH.xlsx");
        return;
    }

    basePayload.limit = 9999999;
    const q = window.mockApiQuery(basePayload);
    
    const wb = XLSX.utils.book_new();
    if (currentTab === 'summary') {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(q.grouped_records), "Tong_Hop");
    } else {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(q.detail_records), "Chi_Tiet");
    }
    
    XLSX.writeFile(wb, filename);
};

// File Upload Handler
window.handleFileUpload = async function() {
    const fileInput = document.getElementById('file-upload');
    if (!fileInput.files.length) {
        alert("Vui lòng chọn ít nhất một file Excel!");
        return;
    }
    
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-overlay').classList.add('flex');
    const loadingStatusText = document.getElementById('loading-status-text');
    const loadingProgressBar = document.getElementById('loading-progress-bar');
    
    try {
        let combinedData = [];
        const files = Array.from(fileInput.files);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (loadingStatusText) loadingStatusText.innerText = `Đang đọc file ${i + 1}/${files.length}: ${file.name}`;
            if (loadingProgressBar) loadingProgressBar.style.width = `${Math.round((i / files.length) * 100)}%`;
            
            const dataBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(new Uint8Array(e.target.result));
                reader.onerror = err => reject(err);
                reader.readAsArrayBuffer(file);
            });
            
            const workbook = XLSX.read(dataBuffer, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {defval: ""});
            
            const mappedData = jsonData.map(r => ({
                donVi: r['donVi'] || r['Đơn vị'] || r['donvi'],
                maKhachHang: r['maKhachHang'] || r['Mã khách hàng'],
                tenKhachHang: r['tenKhachHang'] || r['Tên khách hàng'],
                nam: r['nam'] || r['Năm'],
                thang: r['thang'] || r['Tháng'],
                maTuyenDoc: r['maTuyenDoc'] || r['Mã tuyến đọc'],
                maPhamVi: r['maPhamVi'] || r['Mã phạm vi'],
                mucDich: r['mucDich'] || r['Mục đích SD'],
                maDoiTuongGia: r['maDoiTuongGia'] || r['Mã đối tượng giá'],
                tieuThu: r['tieuThu'] || r['Tiêu thụ'] || 0,
                thanhTien: r['thanhTien'] || r['Thành tiền'] || 0,
                phiVAT: r['phiVAT'] || r['Phí VAT'] || 0,
                phiBVMT: r['phiBVMT'] || r['Phí BVMT'] || 0,
                tongTien: r['tongTien'] || r['Tổng tiền'] || 0
            }));
            
            combinedData = combinedData.concat(mappedData);
        }
        
        window.allData = combinedData;
        if (loadingProgressBar) loadingProgressBar.style.width = '100%';
        if (loadingStatusText) loadingStatusText.innerText = `Đã nạp ${window.allData.length} dòng dữ liệu!`;
        
        // Reset filters & fetch
        activeFilters = {donVi: [], maTuyenDoc: [], maPhamVi: [], mucDich: [], maDoiTuongGia: [], nam: [], thang: [], cc_thangA: []};
        await fetchFilterOptions();
        await applyFilters();
        
        setTimeout(() => {
            alert(`Đã nạp thành công ${files.length} file với tổng số ${window.allData.length} dòng dữ liệu!`);
        }, 100);

    } catch (err) {
        console.error("Lỗi nạp file:", err);
        alert("Lỗi nạp file: " + err);
    } finally {
        setTimeout(() => {
            document.getElementById('loading-overlay').classList.add('hidden');
            document.getElementById('loading-overlay').classList.remove('flex');
            if (loadingProgressBar) loadingProgressBar.style.width = '0%';
            if (loadingStatusText) loadingStatusText.innerText = 'Đang chuẩn bị khởi động...';
        }, 500);
    }
};
