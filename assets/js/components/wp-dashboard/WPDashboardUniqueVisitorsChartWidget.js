/**
 * WPDashboardUniqueVisitorsChartWidget component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import isEmpty from 'lodash/isEmpty';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS,
	DATE_RANGE_OFFSET as DATE_RANGE_OFFSET_ANALYTICS,
} from '../../modules/analytics/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { extractAnalyticsDashboardData } from '../../modules/analytics/util';
import WidgetReportError from '../../googlesitekit/widgets/components/WidgetReportError';
import GoogleChart from '../GoogleChart';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
const { useSelect, useInViewSelect } = Data;

const WPDashboardUniqueVisitorsChartWidget = () => {
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);
	const googleChartsCollisionError = useSelect( ( select ) =>
		select( CORE_UI ).getValue( 'googleChartsCollisionError' )
	);

	const { startDate, endDate, compareStartDate, compareEndDate } = useSelect(
		( select ) =>
			select( CORE_USER ).getDateRangeDates( {
				compare: true,
				offsetDays: DATE_RANGE_OFFSET_ANALYTICS,
			} )
	);

	const dateRangeLength = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeNumberOfDays()
	);

	const reportArgs = {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:date' ],
	};

	const data = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( reportArgs )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
				reportArgs,
			] )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);

	// If we can't load Google Charts, don't display this component at all.
	if ( googleChartsCollisionError ) {
		return null;
	}

	if ( ! ( analyticsModuleActive && analyticsModuleConnected ) ) {
		return null;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	if ( ! isEmpty( data?.[ 0 ] ) ) {
		data[ 0 ].data.rows = Array.isArray( data[ 0 ].data?.rows )
			? data[ 0 ].data?.rows
			: [];
	}
	const googleChartData =
		extractAnalyticsDashboardData(
			data || [],
			0,
			dateRangeLength,
			0,
			1,
			[ __( 'Unique Visitors', 'google-site-kit' ) ],
			[ ( x ) => parseFloat( x ).toLocaleString() ]
		) || [];

	const dates = googleChartData.slice( 1 ).map( ( [ date ] ) => date );
	const options = {
		...WPDashboardUniqueVisitorsChartWidget.chartOptions,
		hAxis: {
			...WPDashboardUniqueVisitorsChartWidget.chartOptions.hAxis,
			ticks: [ dates[ 0 ], dates[ dates.length - 1 ] ],
		},
	};

	const currentValueIndex = 2;
	const previousValueIndex = 3;
	const isZeroChart = ! googleChartData
		.slice( 1 )
		.some(
			( datum ) =>
				datum[ currentValueIndex ] > 0 ||
				datum[ previousValueIndex ] > 0
		);

	if ( isZeroChart ) {
		options.hAxis.ticks = [ new Date() ];
	}

	return (
		<div className="googlesitekit-unique-visitors-chart-widget">
			<h3>Unique visitors over the last 28 days</h3>
			<GoogleChart
				chartType="LineChart"
				data={ googleChartData }
				loadingHeight="270px"
				loadingWidth="100%"
				loaded={ ! ( loading || isGatheringData === undefined ) }
				options={ options }
				gatheringData={ isGatheringData }
			/>
		</div>
	);
};

WPDashboardUniqueVisitorsChartWidget.chartOptions = {
	animation: {
		startup: true,
	},
	chart: {
		title: 'Unique visitors over the last 28 days',
	},
	curveType: 'function',
	height: 270,
	width: '100%',
	chartArea: {
		height: '80%',
		left: 20,
		right: 20,
	},
	legend: {
		position: 'top',
		textStyle: {
			color: '#616161',
			fontSize: 12,
		},
	},
	hAxis: {
		format: 'M/d/yy',
		gridlines: {
			color: '#fff',
		},
		textStyle: {
			color: '#616161',
			fontSize: 12,
		},
	},
	vAxis: {
		textPosition: 'none',
		viewWindow: {
			min: 0,
		},
		gridlines: {
			color: '#eee',
		},
	},
	series: {
		0: {
			color: '#6380b8',
			targetAxisIndex: 0,
		},
		1: {
			color: '#6380b8',
			targetAxisIndex: 0,
			lineDashStyle: [ 3, 3 ],
			lineWidth: 1,
		},
	},
	focusTarget: 'category',
	crosshair: {
		color: 'gray',
		opacity: 0.1,
		orientation: 'vertical',
		trigger: 'both',
	},
	tooltip: {
		isHtml: true, // eslint-disable-line sitekit/acronym-case
		trigger: 'both',
	},
};

export default WPDashboardUniqueVisitorsChartWidget;
