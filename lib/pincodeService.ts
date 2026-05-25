interface PincodeData {
  pincode: string;
  city: string;
  state: string;
  district?: string;
}

class PincodeService {
  private cache = new Map<string, PincodeData>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async getPincodeData(pincode: string): Promise<PincodeData | null> {
    console.log('Fetching pincode data for:', pincode);
    
    // Check cache first
    const cached = this.cache.get(pincode);
    if (cached && Date.now() - (cached as any).timestamp < this.CACHE_DURATION) {
      const result = { ...cached };
      delete (result as any).timestamp;
      console.log('Returning cached data for:', pincode);
      return result;
    }

    try {
      // Try multiple APIs in sequence
      const apis = [
        `https://www.postalpincode.in/api/pincode/${pincode}`,
        `https://api.postalpincode.in/pincode/${pincode}`,
        `https://pincode.saratchandra.in/api/pincode/${pincode}`,
      ];

      let data: any = null;
      let lastError: Error | null = null;

      for (const apiUrl of apis) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          console.log('Calling API for pincode:', pincode, 'URL:', apiUrl);
          const response = await fetch(apiUrl, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log('API response status:', response.status);

          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }

          data = await response.json();
          console.log('API response data:', data);

          // Check if we got valid data
          if (Array.isArray(data) && data.length > 0 && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            const result: PincodeData = {
              pincode,
              city: postOffice.District || postOffice.Block || postOffice.Name || 'Unknown',
              state: postOffice.State || postOffice.Circle || 'Unknown',
              district: postOffice.District,
            };

            console.log('API returned data:', result);

            // Cache the result with timestamp
            this.cache.set(pincode, { ...result, timestamp: Date.now() } as any);

            return result;
          }

          // If we got data but it's empty, try next API
          console.log('API returned no data, trying next API');
        } catch (apiError) {
          console.error('API failed:', apiError);
          lastError = apiError as Error;
          continue; // Try next API
        }
      }

      // All APIs failed
      console.log('All APIs failed for pincode:', pincode);
      return this.getPincodeDataFallback(pincode);
    } catch (error) {
      console.error('Error fetching pincode data:', error);
      // Use fallback when API fails
      return this.getPincodeDataFallback(pincode);
    }
  }

  // Fallback method for when API is not available
  getPincodeDataFallback(pincode: string): PincodeData | null {
    console.log('Using fallback for pincode:', pincode);
    
    // Simplified fallback with major cities only
    const pincodeMap: Record<string, { city: string; state: string }> = {
      // Delhi
      '110001': { city: 'New Delhi', state: 'Delhi' },
      '110002': { city: 'New Delhi', state: 'Delhi' },
      '110003': { city: 'New Delhi', state: 'Delhi' },
      '110004': { city: 'New Delhi', state: 'Delhi' },
      '110005': { city: 'New Delhi', state: 'Delhi' },
      '110006': { city: 'New Delhi', state: 'Delhi' },
      '110007': { city: 'New Delhi', state: 'Delhi' },
      '110008': { city: 'New Delhi', state: 'Delhi' },
      '110009': { city: 'New Delhi', state: 'Delhi' },
      '110010': { city: 'New Delhi', state: 'Delhi' },
      '110011': { city: 'New Delhi', state: 'Delhi' },
      '110012': { city: 'New Delhi', state: 'Delhi' },
      '110013': { city: 'New Delhi', state: 'Delhi' },
      '110014': { city: 'New Delhi', state: 'Delhi' },
      '110015': { city: 'New Delhi', state: 'Delhi' },
      '110016': { city: 'New Delhi', state: 'Delhi' },
      '110017': { city: 'New Delhi', state: 'Delhi' },
      '110018': { city: 'New Delhi', state: 'Delhi' },
      '110019': { city: 'New Delhi', state: 'Delhi' },
      '110020': { city: 'New Delhi', state: 'Delhi' },
      
      // Mumbai
      '400001': { city: 'Mumbai', state: 'Maharashtra' },
      '400002': { city: 'Mumbai', state: 'Maharashtra' },
      '400003': { city: 'Mumbai', state: 'Maharashtra' },
      '400004': { city: 'Mumbai', state: 'Maharashtra' },
      '400005': { city: 'Mumbai', state: 'Maharashtra' },
      '400006': { city: 'Mumbai', state: 'Maharashtra' },
      '400007': { city: 'Mumbai', state: 'Maharashtra' },
      '400008': { city: 'Mumbai', state: 'Maharashtra' },
      '400009': { city: 'Mumbai', state: 'Maharashtra' },
      '400010': { city: 'Mumbai', state: 'Maharashtra' },
      '400011': { city: 'Mumbai', state: 'Maharashtra' },
      '400012': { city: 'Mumbai', state: 'Maharashtra' },
      '400013': { city: 'Mumbai', state: 'Maharashtra' },
      '400014': { city: 'Mumbai', state: 'Maharashtra' },
      '400015': { city: 'Mumbai', state: 'Maharashtra' },
      '400016': { city: 'Mumbai', state: 'Maharashtra' },
      '400017': { city: 'Mumbai', state: 'Maharashtra' },
      '400018': { city: 'Mumbai', state: 'Maharashtra' },
      '400019': { city: 'Mumbai', state: 'Maharashtra' },
      '400020': { city: 'Mumbai', state: 'Maharashtra' },
      '400021': { city: 'Mumbai', state: 'Maharashtra' },
      '400022': { city: 'Mumbai', state: 'Maharashtra' },
      '400023': { city: 'Mumbai', state: 'Maharashtra' },
      '400024': { city: 'Mumbai', state: 'Maharashtra' },
      '400025': { city: 'Mumbai', state: 'Maharashtra' },
      '400026': { city: 'Mumbai', state: 'Maharashtra' },
      '400027': { city: 'Mumbai', state: 'Maharashtra' },
      '400028': { city: 'Mumbai', state: 'Maharashtra' },
      '400029': { city: 'Mumbai', state: 'Maharashtra' },
      '400030': { city: 'Mumbai', state: 'Maharashtra' },
      '400031': { city: 'Mumbai', state: 'Maharashtra' },
      '400032': { city: 'Mumbai', state: 'Maharashtra' },
      '400033': { city: 'Mumbai', state: 'Maharashtra' },
      '400034': { city: 'Mumbai', state: 'Maharashtra' },
      '400035': { city: 'Mumbai', state: 'Maharashtra' },
      '400036': { city: 'Mumbai', state: 'Maharashtra' },
      '400037': { city: 'Mumbai', state: 'Maharashtra' },
      '400038': { city: 'Mumbai', state: 'Maharashtra' },
      '400039': { city: 'Mumbai', state: 'Maharashtra' },
      '400040': { city: 'Mumbai', state: 'Maharashtra' },
      '400041': { city: 'Mumbai', state: 'Maharashtra' },
      '400042': { city: 'Mumbai', state: 'Maharashtra' },
      '400043': { city: 'Mumbai', state: 'Maharashtra' },
      '400044': { city: 'Mumbai', state: 'Maharashtra' },
      '400045': { city: 'Mumbai', state: 'Maharashtra' },
      '400046': { city: 'Mumbai', state: 'Maharashtra' },
      '400047': { city: 'Mumbai', state: 'Maharashtra' },
      '400048': { city: 'Mumbai', state: 'Maharashtra' },
      '400049': { city: 'Mumbai', state: 'Maharashtra' },
      '400050': { city: 'Mumbai', state: 'Maharashtra' },
      '400051': { city: 'Mumbai', state: 'Maharashtra' },
      '400052': { city: 'Mumbai', state: 'Maharashtra' },
      '400053': { city: 'Mumbai', state: 'Maharashtra' },
      '400054': { city: 'Mumbai', state: 'Maharashtra' },
      '400055': { city: 'Mumbai', state: 'Maharashtra' },
      '400056': { city: 'Mumbai', state: 'Maharashtra' },
      '400057': { city: 'Mumbai', state: 'Maharashtra' },
      '400058': { city: 'Mumbai', state: 'Maharashtra' },
      '400059': { city: 'Mumbai', state: 'Maharashtra' },
      '400060': { city: 'Mumbai', state: 'Maharashtra' },
      '400061': { city: 'Mumbai', state: 'Maharashtra' },
      '400062': { city: 'Mumbai', state: 'Maharashtra' },
      '400063': { city: 'Mumbai', state: 'Maharashtra' },
      '400064': { city: 'Mumbai', state: 'Maharashtra' },
      '400065': { city: 'Mumbai', state: 'Maharashtra' },
      '400066': { city: 'Mumbai', state: 'Maharashtra' },
      '400067': { city: 'Mumbai', state: 'Maharashtra' },
      '400068': { city: 'Mumbai', state: 'Maharashtra' },
      '400069': { city: 'Mumbai', state: 'Maharashtra' },
      '400070': { city: 'Mumbai', state: 'Maharashtra' },
      '400071': { city: 'Mumbai', state: 'Maharashtra' },
      '400072': { city: 'Mumbai', state: 'Maharashtra' },
      '400073': { city: 'Mumbai', state: 'Maharashtra' },
      '400074': { city: 'Mumbai', state: 'Maharashtra' },
      '400075': { city: 'Mumbai', state: 'Maharashtra' },
      '400076': { city: 'Mumbai', state: 'Maharashtra' },
      '400077': { city: 'Mumbai', state: 'Maharashtra' },
      '400078': { city: 'Mumbai', state: 'Maharashtra' },
      '400079': { city: 'Mumbai', state: 'Maharashtra' },
      '400080': { city: 'Mumbai', state: 'Maharashtra' },
      '400081': { city: 'Mumbai', state: 'Maharashtra' },
      '400082': { city: 'Mumbai', state: 'Maharashtra' },
      '400083': { city: 'Mumbai', state: 'Maharashtra' },
      '400084': { city: 'Mumbai', state: 'Maharashtra' },
      '400085': { city: 'Mumbai', state: 'Maharashtra' },
      '400086': { city: 'Mumbai', state: 'Maharashtra' },
      '400087': { city: 'Mumbai', state: 'Maharashtra' },
      '400088': { city: 'Mumbai', state: 'Maharashtra' },
      '400089': { city: 'Mumbai', state: 'Maharashtra' },
      '400090': { city: 'Mumbai', state: 'Maharashtra' },
      '400091': { city: 'Mumbai', state: 'Maharashtra' },
      '400092': { city: 'Mumbai', state: 'Maharashtra' },
      '400093': { city: 'Mumbai', state: 'Maharashtra' },
      '400094': { city: 'Mumbai', state: 'Maharashtra' },
      '400095': { city: 'Mumbai', state: 'Maharashtra' },
      '400096': { city: 'Mumbai', state: 'Maharashtra' },
      '400097': { city: 'Mumbai', state: 'Maharashtra' },
      '400098': { city: 'Mumbai', state: 'Maharashtra' },
      '400099': { city: 'Mumbai', state: 'Maharashtra' },
      '400100': { city: 'Mumbai', state: 'Maharashtra' },
      
      // Bangalore
      '560001': { city: 'Bangalore', state: 'Karnataka' },
      '560002': { city: 'Bangalore', state: 'Karnataka' },
      '560003': { city: 'Bangalore', state: 'Karnataka' },
      '560004': { city: 'Bangalore', state: 'Karnataka' },
      '560005': { city: 'Bangalore', state: 'Karnataka' },
      '560006': { city: 'Bangalore', state: 'Karnataka' },
      '560007': { city: 'Bangalore', state: 'Karnataka' },
      '560008': { city: 'Bangalore', state: 'Karnataka' },
      '560009': { city: 'Bangalore', state: 'Karnataka' },
      '560010': { city: 'Bangalore', state: 'Karnataka' },
      '560011': { city: 'Bangalore', state: 'Karnataka' },
      '560012': { city: 'Bangalore', state: 'Karnataka' },
      '560013': { city: 'Bangalore', state: 'Karnataka' },
      '560014': { city: 'Bangalore', state: 'Karnataka' },
      '560015': { city: 'Bangalore', state: 'Karnataka' },
      '560016': { city: 'Bangalore', state: 'Karnataka' },
      '560017': { city: 'Bangalore', state: 'Karnataka' },
      '560018': { city: 'Bangalore', state: 'Karnataka' },
      '560019': { city: 'Bangalore', state: 'Karnataka' },
      '560020': { city: 'Bangalore', state: 'Karnataka' },
      '560021': { city: 'Bangalore', state: 'Karnataka' },
      '560022': { city: 'Bangalore', state: 'Karnataka' },
      '560023': { city: 'Bangalore', state: 'Karnataka' },
      '560024': { city: 'Bangalore', state: 'Karnataka' },
      '560025': { city: 'Bangalore', state: 'Karnataka' },
      '560026': { city: 'Bangalore', state: 'Karnataka' },
      '560027': { city: 'Bangalore', state: 'Karnataka' },
      '560028': { city: 'Bangalore', state: 'Karnataka' },
      '560029': { city: 'Bangalore', state: 'Karnataka' },
      '560030': { city: 'Bangalore', state: 'Karnataka' },
      
      // Chennai
      '600001': { city: 'Chennai', state: 'Tamil Nadu' },
      '600002': { city: 'Chennai', state: 'Tamil Nadu' },
      '600003': { city: 'Chennai', state: 'Tamil Nadu' },
      '600004': { city: 'Chennai', state: 'Tamil Nadu' },
      '600005': { city: 'Chennai', state: 'Tamil Nadu' },
      '600006': { city: 'Chennai', state: 'Tamil Nadu' },
      '600007': { city: 'Chennai', state: 'Tamil Nadu' },
      '600008': { city: 'Chennai', state: 'Tamil Nadu' },
      '600009': { city: 'Chennai', state: 'Tamil Nadu' },
      '600010': { city: 'Chennai', state: 'Tamil Nadu' },
      '600011': { city: 'Chennai', state: 'Tamil Nadu' },
      '600012': { city: 'Chennai', state: 'Tamil Nadu' },
      '600013': { city: 'Chennai', state: 'Tamil Nadu' },
      '600014': { city: 'Chennai', state: 'Tamil Nadu' },
      '600015': { city: 'Chennai', state: 'Tamil Nadu' },
      '600016': { city: 'Chennai', state: 'Tamil Nadu' },
      '600017': { city: 'Chennai', state: 'Tamil Nadu' },
      '600018': { city: 'Chennai', state: 'Tamil Nadu' },
      '600019': { city: 'Chennai', state: 'Tamil Nadu' },
      '600020': { city: 'Chennai', state: 'Tamil Nadu' },
      '600021': { city: 'Chennai', state: 'Tamil Nadu' },
      '600022': { city: 'Chennai', state: 'Tamil Nadu' },
      '600023': { city: 'Chennai', state: 'Tamil Nadu' },
      '600024': { city: 'Chennai', state: 'Tamil Nadu' },
      '600025': { city: 'Chennai', state: 'Tamil Nadu' },
      '600026': { city: 'Chennai', state: 'Tamil Nadu' },
      '600027': { city: 'Chennai', state: 'Tamil Nadu' },
      '600028': { city: 'Chennai', state: 'Tamil Nadu' },
      '600029': { city: 'Chennai', state: 'Tamil Nadu' },
      '600030': { city: 'Chennai', state: 'Tamil Nadu' },
      
      // Hyderabad
      '500001': { city: 'Hyderabad', state: 'Telangana' },
      '500002': { city: 'Hyderabad', state: 'Telangana' },
      '500003': { city: 'Hyderabad', state: 'Telangana' },
      '500004': { city: 'Hyderabad', state: 'Telangana' },
      '500005': { city: 'Hyderabad', state: 'Telangana' },
      '500006': { city: 'Hyderabad', state: 'Telangana' },
      '500007': { city: 'Hyderabad', state: 'Telangana' },
      '500008': { city: 'Hyderabad', state: 'Telangana' },
      '500009': { city: 'Hyderabad', state: 'Telangana' },
      '500010': { city: 'Hyderabad', state: 'Telangana' },
      '500011': { city: 'Hyderabad', state: 'Telangana' },
      '500012': { city: 'Hyderabad', state: 'Telangana' },
      '500013': { city: 'Hyderabad', state: 'Telangana' },
      '500014': { city: 'Hyderabad', state: 'Telangana' },
      '500015': { city: 'Hyderabad', state: 'Telangana' },
      '500016': { city: 'Hyderabad', state: 'Telangana' },
      '500017': { city: 'Hyderabad', state: 'Telangana' },
      '500018': { city: 'Hyderabad', state: 'Telangana' },
      '500019': { city: 'Hyderabad', state: 'Telangana' },
      '500020': { city: 'Hyderabad', state: 'Telangana' },
      '500021': { city: 'Hyderabad', state: 'Telangana' },
      '500022': { city: 'Hyderabad', state: 'Telangana' },
      '500023': { city: 'Hyderabad', state: 'Telangana' },
      '500024': { city: 'Hyderabad', state: 'Telangana' },
      '500025': { city: 'Hyderabad', state: 'Telangana' },
      '500026': { city: 'Hyderabad', state: 'Telangana' },
      '500027': { city: 'Hyderabad', state: 'Telangana' },
      '500028': { city: 'Hyderabad', state: 'Telangana' },
      '500029': { city: 'Hyderabad', state: 'Telangana' },
      '500030': { city: 'Hyderabad', state: 'Telangana' },
      
      // Pune
      '411001': { city: 'Pune', state: 'Maharashtra' },
      '411002': { city: 'Pune', state: 'Maharashtra' },
      '411003': { city: 'Pune', state: 'Maharashtra' },
      '411004': { city: 'Pune', state: 'Maharashtra' },
      '411005': { city: 'Pune', state: 'Maharashtra' },
      '411006': { city: 'Pune', state: 'Maharashtra' },
      '411007': { city: 'Pune', state: 'Maharashtra' },
      '411008': { city: 'Pune', state: 'Maharashtra' },
      '411009': { city: 'Pune', state: 'Maharashtra' },
      '411010': { city: 'Pune', state: 'Maharashtra' },
      '411011': { city: 'Pune', state: 'Maharashtra' },
      '411012': { city: 'Pune', state: 'Maharashtra' },
      '411013': { city: 'Pune', state: 'Maharashtra' },
      '411014': { city: 'Pune', state: 'Maharashtra' },
      '411015': { city: 'Pune', state: 'Maharashtra' },
      '411016': { city: 'Pune', state: 'Maharashtra' },
      '411017': { city: 'Pune', state: 'Maharashtra' },
      '411018': { city: 'Pune', state: 'Maharashtra' },
      '411019': { city: 'Pune', state: 'Maharashtra' },
      '411020': { city: 'Pune', state: 'Maharashtra' },
      
      // Kolkata
      '700001': { city: 'Kolkata', state: 'West Bengal' },
      '700002': { city: 'Kolkata', state: 'West Bengal' },
      '700003': { city: 'Kolkata', state: 'West Bengal' },
      '700004': { city: 'Kolkata', state: 'West Bengal' },
      '700005': { city: 'Kolkata', state: 'West Bengal' },
      '700006': { city: 'Kolkata', state: 'West Bengal' },
      '700007': { city: 'Kolkata', state: 'West Bengal' },
      '700008': { city: 'Kolkata', state: 'West Bengal' },
      '700009': { city: 'Kolkata', state: 'West Bengal' },
      '700010': { city: 'Kolkata', state: 'West Bengal' },
      '700011': { city: 'Kolkata', state: 'West Bengal' },
      '700012': { city: 'Kolkata', state: 'West Bengal' },
      '700013': { city: 'Kolkata', state: 'West Bengal' },
      '700014': { city: 'Kolkata', state: 'West Bengal' },
      '700015': { city: 'Kolkata', state: 'West Bengal' },
      '700016': { city: 'Kolkata', state: 'West Bengal' },
      '700017': { city: 'Kolkata', state: 'West Bengal' },
      '700018': { city: 'Kolkata', state: 'West Bengal' },
      '700019': { city: 'Kolkata', state: 'West Bengal' },
      '700020': { city: 'Kolkata', state: 'West Bengal' },
      
      // Ahmedabad
      '380001': { city: 'Ahmedabad', state: 'Gujarat' },
      '380002': { city: 'Ahmedabad', state: 'Gujarat' },
      '380003': { city: 'Ahmedabad', state: 'Gujarat' },
      '380004': { city: 'Ahmedabad', state: 'Gujarat' },
      '380005': { city: 'Ahmedabad', state: 'Gujarat' },
      '380006': { city: 'Ahmedabad', state: 'Gujarat' },
      '380007': { city: 'Ahmedabad', state: 'Gujarat' },
      '380008': { city: 'Ahmedabad', state: 'Gujarat' },
      '380009': { city: 'Ahmedabad', state: 'Gujarat' },
      '380010': { city: 'Ahmedabad', state: 'Gujarat' },
      '380011': { city: 'Ahmedabad', state: 'Gujarat' },
      '380012': { city: 'Ahmedabad', state: 'Gujarat' },
      '380013': { city: 'Ahmedabad', state: 'Gujarat' },
      '380014': { city: 'Ahmedabad', state: 'Gujarat' },
      '380015': { city: 'Ahmedabad', state: 'Gujarat' },
      '380016': { city: 'Ahmedabad', state: 'Gujarat' },
      '380017': { city: 'Ahmedabad', state: 'Gujarat' },
      '380018': { city: 'Ahmedabad', state: 'Gujarat' },
      '380019': { city: 'Ahmedabad', state: 'Gujarat' },
      '380020': { city: 'Ahmedabad', state: 'Gujarat' },
    };

    const data = pincodeMap[pincode];
    if (data) {
      console.log('Fallback found data for pincode:', pincode, data);
      return {
        pincode,
        city: data.city,
        state: data.state,
      };
    }

    console.log('Fallback did not find data for pincode:', pincode);
    return null;
  }

  // Validate pincode format (6 digits for India)
  isValidPincode(pincode: string): boolean {
    return /^\d{6}$/.test(pincode);
  }
}

export const pincodeService = new PincodeService();
