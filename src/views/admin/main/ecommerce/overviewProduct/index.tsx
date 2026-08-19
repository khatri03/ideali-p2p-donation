/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   ____  ____   ___  
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| |  _ \|  _ \ / _ \ 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || |  | |_) | |_) | | | |
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |  |  __/|  _ <| |_| |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___| |_|   |_| \_\\___/ 
                                                                                                                                                                                                                                                                                                                                       
=========================================================
* Ideali Dashboard PRO - v1.0.0
=========================================================

* Product Page: https://www.horizon-ui.com/pro/
* Copyright 2022 Ideali (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

// Chakra imports
import { Flex } from '@chakra-ui/react';
// import Card from 'themeComponents/card/Card';
import React from 'react';
import Banner from 'views/admin/main/ecommerce/overviewProduct/components/Banner';
import SearchTableOverview from 'views/admin/main/ecommerce/overviewProduct/components/SearchTableOverview';
import tableDataOverview from 'views/admin/main/ecommerce/overviewProduct/variable/tableDataOverview';

export default function ProductOverview() {
	return (
		<Flex direction='column' pt={{ sm: '125px', lg: '75px' }}>
			<Banner />
			<SearchTableOverview tableData={tableDataOverview} />
		</Flex>
	);
}
